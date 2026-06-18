"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  assignSystemAdminRole,
  fetchSystemAdmins,
  removeSystemAdminRole,
  type SystemAdminUser,
} from "@/lib/api/backOfficeUsers";
import { fetchAdminRoles } from "@/lib/api/security";
import { asArray } from "@/lib/api/normalize";
import { getRoleLabel } from "@/lib/auth/roles";
import { getStoredPermissions } from "@/lib/auth/session";
import {
  getApiErrorMessage,
  showApiErrorToast,
} from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";

type RoleRow = { id?: number; name?: string };

export default function BackOfficeUsersPage() {
  const [admins, setAdmins] = useState<SystemAdminUser[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [assignAdminId, setAssignAdminId] = useState<number | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const perms = new Set(getStoredPermissions());
  const canAssign = perms.has("admin:roles:update");
  const canRemove = perms.has("admin:roles:delete");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      let adminLoadError: unknown = null;
      let rolesLoadError: unknown = null;

      const [adminResult, rolesResult] = await Promise.allSettled([
        fetchSystemAdmins(),
        fetchAdminRoles(),
      ]);

      if (adminResult.status === "fulfilled") {
        setAdmins(adminResult.value.content ?? []);
      } else {
        adminLoadError = adminResult.reason;
        setAdmins([]);
      }

      if (rolesResult.status === "fulfilled") {
        setRoles(
          asArray<RoleRow>(rolesResult.value).filter(
            (r) => typeof r.id === "number" && typeof r.name === "string",
          ),
        );
      } else {
        rolesLoadError = rolesResult.reason;
        setRoles([]);
      }

      if (adminLoadError) {
        const message = getApiErrorMessage(adminLoadError, {
          fallbackMessage: "Failed to load back-office users",
        });
        showApiErrorToast(adminLoadError, {
          fallbackMessage: "Failed to load back-office users",
          toastId: "back-office-admins-load",
        });
        setLoadError(message);
      } else if (rolesLoadError) {
        showApiErrorToast(rolesLoadError, {
          fallbackMessage: "Failed to load platform roles",
          toastId: "back-office-roles-load",
        });
      }
    } catch (e) {
      const message = getApiErrorMessage(e, {
        fallbackMessage: "Failed to load back-office users",
      });
      showApiErrorToast(e, {
        fallbackMessage: "Failed to load back-office users",
        toastId: "back-office-load",
      });
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAssign() {
    if (assignAdminId == null || !selectedRoleId) return;
    setActing(true);
    try {
      await assignSystemAdminRole(assignAdminId, Number(selectedRoleId));
      toast.success("Platform role assigned");
      setAssignAdminId(null);
      setSelectedRoleId("");
      await load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Failed to assign role" });
    } finally {
      setActing(false);
    }
  }

  async function handleRemove(adminId: number, roleId: number, roleName: string) {
    setActing(true);
    try {
      await removeSystemAdminRole(adminId, roleId);
      toast.success(`Removed ${getRoleLabel(roleName)}`);
      await load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Failed to remove role" });
    } finally {
      setActing(false);
    }
  }

  function roleIdByName(name: string): number | undefined {
    return roles.find((r) => r.name === name)?.id;
  }

  return (
    <div>
      <h1 className={styles.h1}>Back-office users</h1>
      <p className={styles.muted}>
        {canAssign
          ? "Assign platform roles to system admin accounts."
          : "View back-office users and their platform roles."}
      </p>

      {loadError && <p className={styles.error}>{loadError}</p>}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : admins.length === 0 ? (
        <p className={styles.muted}>No back-office users found.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Email</th>
                <th className={styles.th}>Department</th>
                <th className={styles.th}>Roles</th>
                {(canAssign || canRemove) && <th className={styles.th}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => {
                const roleNames = Array.isArray(admin.roles)
                  ? [...admin.roles]
                  : admin.roles
                    ? [...admin.roles]
                    : [];
                return (
                  <tr key={admin.id}>
                    <td className={styles.td}>{admin.displayName || "—"}</td>
                    <td className={styles.td}>{admin.email}</td>
                    <td className={styles.td}>{admin.department || "—"}</td>
                    <td className={styles.td}>
                      {roleNames.length
                        ? roleNames.map((r) => getRoleLabel(r)).join(", ")
                        : "—"}
                    </td>
                    {(canAssign || canRemove) && (
                      <td className={styles.td}>
                        {canAssign && (
                          <button
                            type="button"
                            className={styles.button}
                            disabled={acting}
                            onClick={() => {
                              setAssignAdminId(admin.id);
                              setSelectedRoleId("");
                            }}
                          >
                            Assign role
                          </button>
                        )}
                        {canRemove &&
                          roleNames.map((roleName) => {
                            const roleId = roleIdByName(roleName);
                            if (roleId == null) return null;
                            return (
                              <button
                                key={roleName}
                                type="button"
                                className={styles.button}
                                disabled={acting}
                                style={{ marginLeft: 6 }}
                                onClick={() =>
                                  void handleRemove(admin.id, roleId, roleName)
                                }
                              >
                                Remove {getRoleLabel(roleName)}
                              </button>
                            );
                          })}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {assignAdminId != null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "color-mix(in oklab, black 40%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setAssignAdminId(null)}
        >
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              padding: 20,
              minWidth: 320,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 12px", fontSize: "1.1rem" }}>Assign platform role</h2>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              style={{ width: "100%", marginBottom: 12, padding: 8 }}
            >
              <option value="">Select role…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {getRoleLabel(r.name ?? "")}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" className={styles.button} onClick={() => setAssignAdminId(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.button}
                disabled={acting || !selectedRoleId}
                onClick={() => void handleAssign()}
              >
                {acting ? "Saving…" : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
