"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  fetchProviderStaff,
  updateStaffRole,
  suspendStaff,
  type StaffMember,
  type ProviderStaffRole,
} from "@/lib/api/providerUsers";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";
import userStyles from "./users.module.css";
import EditRoleModal from "./EditRoleModal";
import ConfirmModal from "./ConfirmModal";

const ROLE_LABELS: Record<string, string> = {
  SERVICE_PROVIDER_OWNER: "Owner",
  SERVICE_PROVIDER_MANAGER: "Manager",
  SERVICE_PROVIDER_STAFF: "Staff",
};

function formatRole(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

export default function UsersPage() {
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

  // Extract permissions from JWT for UI gating
  const [userPermissions, setUserPermissions] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token") ?? sessionStorage.getItem("access_token")
          : null;
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (Array.isArray(payload.permissions)) {
          setUserPermissions(new Set(payload.permissions));
        }
      }
    } catch {
      /* ignore parse errors */
    }
  }, []);

  const canEditRole = userPermissions.has("provider:org:update");
  const canDeactivate = userPermissions.has("provider:org:delete");

  const loadStaff = useCallback(async () => {
    if (!providerId) {
      setStaff([]);
      setLoading(false);
      setError("No provider context found. Staff list requires a provider-scoped session.");
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
        <button className={styles.button} onClick={loadStaff}>
          Refresh
        </button>
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
                      {canModify(m) ? (
                        <div className={userStyles.actions}>
                          {canEditRole && (
                            <button className={userStyles.actionBtn} onClick={() => setEditTarget(m)}>
                              Edit
                            </button>
                          )}
                          {canDeactivate && (
                            <button
                              className={userStyles.deactivateBtn}
                              onClick={() => setDeactivateTarget(m)}
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className={styles.muted}>—</span>
                      )}
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
