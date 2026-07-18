"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [search, setSearch] = useState("");
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

  const filtered = search
    ? staff.filter(
        (s) =>
          s.displayName?.toLowerCase().includes(search.toLowerCase()) ||
          s.email?.toLowerCase().includes(search.toLowerCase()),
      )
    : staff;

  return (
    <div>
      <h1 className={styles.h1}>Staff</h1>

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.muted}>Loading staff…</p>
      ) : filtered.length === 0 ? (
        <p className={styles.muted}>No staff members found.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Email</th>
                <th className={styles.th}>Role</th>
                <th className={styles.th}>Status</th>
                {(canEditRole || canDeactivate) && <th className={styles.th}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.userId}>
                  <td className={styles.td}>{m.displayName || "—"}</td>
                  <td className={styles.td}>{m.email}</td>
                  <td className={styles.td}>{formatRole(m.role)}</td>
                  <td className={styles.td}>
                    <span className={m.status === "ACTIVE" ? styles.badgeOk : styles.badgeNo}>
                      {m.status === "ACTIVE" ? "Active" : "Suspended"}
                    </span>
                  </td>
                  {(canEditRole || canDeactivate) && (
                    <td className={styles.td}>
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
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
