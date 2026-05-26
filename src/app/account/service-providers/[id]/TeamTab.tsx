"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import DataTable, { type DataTableColumn } from "@/components/account/DataTable";
import { SkeletonTable } from "@/components/account/Skeleton";
import ConfirmModal from "@/components/account/ConfirmModal";
import {
  fetchProviderStaffAdmin,
  updateProviderStaffAdmin,
  suspendProviderStaffAdmin,
  type AdminStaffMember,
} from "@/lib/api/serviceProviders";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import { getStoredPermissions } from "@/lib/auth/session";
import styles from "./provider.module.css";

const ROLES = ["SERVICE_PROVIDER_OWNER", "SERVICE_PROVIDER_MANAGER", "SERVICE_PROVIDER_STAFF"];

export default function TeamTab({ providerId }: { providerId: number }) {
  const [rows, setRows] = useState<AdminStaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [suspendTarget, setSuspendTarget] = useState<AdminStaffMember | null>(null);
  const [busy, setBusy] = useState(false);

  const canManage = getStoredPermissions().includes("admin:providers:staff");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchProviderStaffAdmin(providerId));
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load team members." });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeRole = async (m: AdminStaffMember, role: string) => {
    if (role === m.role) return;
    try {
      await updateProviderStaffAdmin(providerId, m.userId, role);
      toast.success("Role updated");
      void load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not change role." });
    }
  };

  const applySuspend = async () => {
    if (!suspendTarget) return;
    setBusy(true);
    try {
      await suspendProviderStaffAdmin(providerId, suspendTarget.userId);
      toast.success("Member disabled");
      setSuspendTarget(null);
      void load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not disable member." });
    } finally {
      setBusy(false);
    }
  };

  const columns: DataTableColumn<AdminStaffMember>[] = [
    { id: "n", header: "#", cell: (_r, i) => i + 1 },
    { id: "name", header: "Full Name", cell: (r) => r.displayName },
    { id: "email", header: "Email", cell: (r) => r.email },
    {
      id: "role",
      header: "Role",
      cell: (r) =>
        canManage ? (
          <select value={r.role} onChange={(e) => changeRole(r, e.target.value)}>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role.replace("SERVICE_PROVIDER_", "")}
              </option>
            ))}
          </select>
        ) : (
          r.role.replace("SERVICE_PROVIDER_", "")
        ),
    },
    { id: "status", header: "Status", cell: (r) => r.status },
    {
      id: "actions",
      header: "",
      cell: (r) =>
        canManage && r.status === "ACTIVE" ? (
          <button className={styles.actionBtn} onClick={() => setSuspendTarget(r)}>
            Disable
          </button>
        ) : null,
    },
  ];

  return (
    <div>
      {loading ? (
        <SkeletonTable cols={6} />
      ) : rows.length === 0 ? (
        <p>No team members found.</p>
      ) : (
        <DataTable columns={columns} rows={rows} getRowKey={(r) => r.userId} />
      )}

      {suspendTarget && (
        <ConfirmModal
          title="Disable member"
          message={`Disable ${suspendTarget.displayName}'s access?`}
          confirmLabel="Disable"
          confirmDestructive
          loading={busy}
          onConfirm={applySuspend}
          onCancel={() => setSuspendTarget(null)}
        />
      )}
    </div>
  );
}
