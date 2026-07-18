"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  fetchProviderStaff,
  updateStaffRole,
  suspendStaff,
  activateStaff,
  type StaffMember,
  type ProviderStaffRole,
} from "@/lib/api/providerUsers";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import { getStoredPermissions } from "@/lib/auth/session";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";
import DataTable, { type DataTableColumn } from "@/components/account/DataTable";
import RowActionsMenu from "@/components/account/RowActionsMenu";
import EditRoleModal from "./EditRoleModal";
import ConfirmModal from "@/components/account/ConfirmModal";
import BackOfficeUsersManager from "./BackOfficeUsersManager";

const ROLE_LABELS: Record<string, string> = {
  SERVICE_PROVIDER_OWNER: "Owner",
  SERVICE_PROVIDER_MANAGER: "Manager",
  SERVICE_PROVIDER_STAFF: "Staff",
};

function formatRole(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

export default function UsersPage() {
  const ctx = getAccessTokenContext();
  if (ctx.identityType === "SYSTEM_ADMIN" && ctx.providerId == null) {
    return <BackOfficeUsersManager title="Staff" />;
  }
  return <ProviderStaffView />;
}

function ProviderStaffView() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<StaffMember | null>(null);

  const ctx = getAccessTokenContext();
  const providerId = ctx?.providerId;
  const currentUserId = ctx?.userId;

  const perms = new Set(getStoredPermissions());
  const canEditRole = perms.has("provider:roles:update");
  const canDeactivate = perms.has("provider:org:delete");

  const loadStaff = useCallback(async () => {
    if (!providerId) {
      setStaff([]);
      setLoading(false);
      setError("No provider context found. Staff list requires the user to be a staff member of a provider.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setStaff(await fetchProviderStaff(providerId));
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Failed to load staff" });
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const activeOwnerCount = staff.filter(
    (s) => s.role === "SERVICE_PROVIDER_OWNER" && s.status === "ACTIVE",
  ).length;

  function canModify(member: StaffMember): boolean {
    if (member.userId === currentUserId) return false;
    if (member.status !== "ACTIVE") return false;
    if (member.role === "SERVICE_PROVIDER_OWNER" && activeOwnerCount <= 1) return false;
    return true;
  }

  async function handleUpdateRole(role: ProviderStaffRole) {
    if (!providerId || !editTarget) return;
    setActing(true);
    try {
      await updateStaffRole(providerId, editTarget.userId, role);
      toast.success(`${editTarget.displayName}'s role updated to ${formatRole(role)}`);
      setEditTarget(null);
      loadStaff();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Failed to update role" });
    } finally {
      setActing(false);
    }
  }

  async function handleDeactivate() {
    if (!providerId || !deactivateTarget) return;
    setActing(true);
    try {
      await suspendStaff(providerId, deactivateTarget.userId);
      toast.success(`${deactivateTarget.displayName} has been deactivated`);
      setDeactivateTarget(null);
      loadStaff();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Failed to deactivate staff member" });
    } finally {
      setActing(false);
    }
  }

  async function handleActivate(member: StaffMember) {
    if (!providerId) return;
    setActing(true);
    try {
      await activateStaff(providerId, member.userId);
      toast.success(`${member.displayName} has been reactivated`);
      loadStaff();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Failed to activate staff member" });
    } finally {
      setActing(false);
    }
  }

  const showActions = canEditRole || canDeactivate;

  const columns = useMemo<DataTableColumn<StaffMember>[]>(
    () => [
      { id: "name", header: "Name", cell: (m) => m.displayName || "—" },
      { id: "email", header: "Email", cell: (m) => m.email },
      { id: "role", header: "Role", cell: (m) => formatRole(m.role) },
      {
        id: "status",
        header: "Status",
        cell: (m) => (
          <span className={m.status === "ACTIVE" ? styles.badgeOk : styles.badgeNo}>
            {m.status === "ACTIVE" ? "Active" : "Suspended"}
          </span>
        ),
      },
      ...(showActions
        ? [
            {
              id: "actions",
              header: "Actions",
              cell: (m: StaffMember) => (
                <RowActionsMenu
                  label={`Actions for ${m.displayName}`}
                  items={[
                    {
                      label: "Edit Role",
                      onClick: () => setEditTarget(m),
                      hidden: !canEditRole || m.status !== "ACTIVE" || !canModify(m),
                    },
                    {
                      label: "Deactivate",
                      onClick: () => setDeactivateTarget(m),
                      destructive: true,
                      hidden: !canDeactivate || m.status !== "ACTIVE" || !canModify(m),
                    },
                    {
                      label: acting ? "Activating…" : "Activate",
                      onClick: () => void handleActivate(m),
                      hidden: !canEditRole || m.status !== "SUSPENDED",
                      disabled: acting,
                    },
                  ]}
                />
              ),
            } satisfies DataTableColumn<StaffMember>,
          ]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [acting, canDeactivate, canEditRole, showActions, staff],
  );

  return (
    <div>
      <h1 className={styles.h1}>Staff</h1>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.muted}>Loading staff…</p>
      ) : staff.length === 0 ? (
        <p className={styles.muted}>No staff members found.</p>
      ) : (
        <DataTable
          columns={columns}
          rows={staff}
          getRowKey={(m) => m.userId}
          searchable
          searchPlaceholder="Search by name or email"
          searchAccessor={(m) => `${m.displayName ?? ""} ${m.email ?? ""}`}
          filters={[
            {
              id: "role",
              label: "Role",
              options: [
                { value: "", label: "All roles" },
                { value: "SERVICE_PROVIDER_OWNER", label: "Owner" },
                { value: "SERVICE_PROVIDER_MANAGER", label: "Manager" },
                { value: "SERVICE_PROVIDER_STAFF", label: "Staff" },
              ],
              predicate: (m, value) => m.role === value,
            },
            {
              id: "status",
              label: "Status",
              options: [
                { value: "", label: "All statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "SUSPENDED", label: "Suspended" },
              ],
              predicate: (m, value) => m.status === value,
            },
          ]}
          pageSize={10}
          emptyMessage="No staff members match your search."
        />
      )}

      {editTarget && (
        <EditRoleModal
          staff={editTarget}
          callerIsOwner={staff.some(
            (s) => s.userId === currentUserId && s.role === "SERVICE_PROVIDER_OWNER",
          )}
          loading={acting}
          onSave={handleUpdateRole}
          onCancel={() => setEditTarget(null)}
        />
      )}

      {deactivateTarget && (
        <ConfirmModal
          title="Deactivate Staff Member"
          message={`Are you sure you want to deactivate ${deactivateTarget.displayName}? They will lose access to the organization.`}
          confirmLabel="Deactivate"
          confirmDestructive
          loading={acting}
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivateTarget(null)}
        />
      )}
    </div>
  );
}
