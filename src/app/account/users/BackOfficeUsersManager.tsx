"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  assignSystemAdminRole,
  createSystemAdmin,
  fetchSystemAdmins,
  removeSystemAdminRole,
  updateSystemAdmin,
  updateSystemAdminStatus,
  type CreateSystemAdminRequest,
  type SystemAdminUser,
  type UpdateSystemAdminRequest,
} from "@/lib/api/backOfficeUsers";
import { fetchAdminRoles } from "@/lib/api/security";
import { asArray } from "@/lib/api/normalize";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import { getRoleLabel } from "@/lib/auth/roles";
import { getStoredPermissions } from "@/lib/auth/session";
import {
  getApiErrorMessage,
  showApiErrorToast,
} from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";
import ConfirmModal from "@/components/account/ConfirmModal";
import PageHeader from "@/components/account/PageHeader";
import RowActionsMenu from "@/components/account/RowActionsMenu";
import CreateAdminModal from "./CreateAdminModal";
import EditAdminModal from "./EditAdminModal";
import modalStyles from "./adminUsers.module.css";

type RoleRow = { id?: number; name?: string };

type BackOfficeUsersManagerProps = {
  title?: string;
};

export default function BackOfficeUsersManager({
  title = "Back-office users",
}: BackOfficeUsersManagerProps) {
  const [admins, setAdmins] = useState<SystemAdminUser[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [assignAdminId, setAssignAdminId] = useState<number | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<SystemAdminUser | null>(null);
  const [disableTarget, setDisableTarget] = useState<SystemAdminUser | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const currentUserId = getAccessTokenContext().userId;
  const perms = new Set(getStoredPermissions());
  const canCreate = perms.has("admin:roles:create");
  const canEdit = perms.has("admin:roles:update");
  const canAssign = perms.has("admin:roles:update");
  const canRemove = perms.has("admin:roles:delete");
  const canSetStatus = perms.has("admin:users:delete");
  const showActions = canEdit || canAssign || canRemove || canSetStatus;

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

  async function handleCreate(data: CreateSystemAdminRequest) {
    setActing(true);
    try {
      await createSystemAdmin(data);
      toast.success("Back-office user created");
      setShowCreateModal(false);
      await load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Failed to create back-office user" });
    } finally {
      setActing(false);
    }
  }

  async function handleUpdate(data: UpdateSystemAdminRequest) {
    if (!editTarget) return;
    setActing(true);
    try {
      await updateSystemAdmin(editTarget.id, data);
      toast.success("Back-office user updated");
      setEditTarget(null);
      await load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Failed to update back-office user" });
    } finally {
      setActing(false);
    }
  }

  async function handleSetStatus(admin: SystemAdminUser, enabled: boolean) {
    setActing(true);
    try {
      await updateSystemAdminStatus(admin.id, enabled);
      toast.success(enabled ? "User activated" : "User disabled");
      setDisableTarget(null);
      await load();
    } catch (e) {
      showApiErrorToast(e, {
        fallbackMessage: enabled ? "Failed to activate user" : "Failed to disable user",
      });
    } finally {
      setActing(false);
    }
  }

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

  function canModifyStatus(admin: SystemAdminUser): boolean {
    return admin.userId !== currentUserId;
  }

  function roleIdByName(name: string): number | undefined {
    return roles.find((r) => r.name === name)?.id;
  }

  return (
    <div>
      <PageHeader
        title={title}
        description={
          canCreate
            ? "Create and manage system admin accounts, roles, and access."
            : canAssign
              ? "Assign platform roles to system admin accounts."
              : "View back-office users and their platform roles."
        }
        addLabel={canCreate ? "Create user" : undefined}
        onAdd={canCreate ? () => setShowCreateModal(true) : undefined}
        addDisabled={acting}
      />

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
                <th className={styles.th}>Status</th>
                {showActions && <th className={styles.th}>Actions</th>}
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
                    <td className={styles.td}>
                      <span className={admin.enabled ? styles.badgeOk : styles.badgeNo}>
                        {admin.enabled ? "Active" : "Disabled"}
                      </span>
                    </td>
                    {showActions && (
                      <td className={styles.td}>
                        <RowActionsMenu
                          label={`Actions for ${admin.displayName || admin.email}`}
                          items={[
                            {
                              label: "Edit details",
                              onClick: () => setEditTarget(admin),
                              hidden: !canEdit,
                              disabled: acting,
                            },
                            {
                              label: "Assign role",
                              onClick: () => {
                                setAssignAdminId(admin.id);
                                setSelectedRoleId("");
                              },
                              hidden: !canAssign,
                              disabled: acting || !admin.enabled,
                            },
                            ...roleNames.flatMap((roleName) => {
                              const roleId = roleIdByName(roleName);
                              if (!canRemove || roleId == null) return [];
                              return [
                                {
                                  label: `Remove ${getRoleLabel(roleName)}`,
                                  onClick: () =>
                                    void handleRemove(admin.id, roleId, roleName),
                                  destructive: true,
                                  disabled: acting || !admin.enabled,
                                },
                              ];
                            }),
                            {
                              label: "Activate",
                              onClick: () => void handleSetStatus(admin, true),
                              hidden: !canSetStatus || admin.enabled || !canModifyStatus(admin),
                              disabled: acting,
                            },
                            {
                              label: "Disable",
                              onClick: () => setDisableTarget(admin),
                              hidden: !canSetStatus || !admin.enabled || !canModifyStatus(admin),
                              destructive: true,
                              disabled: acting,
                            },
                          ]}
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <CreateAdminModal
          roles={roles.filter(
            (r): r is { id: number; name: string } =>
              typeof r.id === "number" && typeof r.name === "string",
          )}
          loading={acting}
          onSave={handleCreate}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {editTarget && (
        <EditAdminModal
          admin={editTarget}
          loading={acting}
          onSave={handleUpdate}
          onCancel={() => setEditTarget(null)}
        />
      )}

      {disableTarget && (
        <ConfirmModal
          title="Disable back-office user"
          message={`Disable ${disableTarget.displayName || disableTarget.email}? They will lose access until reactivated.`}
          confirmLabel="Disable"
          confirmDestructive
          loading={acting}
          onConfirm={() => void handleSetStatus(disableTarget, false)}
          onCancel={() => setDisableTarget(null)}
        />
      )}

      {assignAdminId != null && (
        <div className={modalStyles.overlay} onClick={() => setAssignAdminId(null)}>
          <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={modalStyles.modalTitle}>Assign platform role</h2>
            <div className={modalStyles.formField}>
              <label className={modalStyles.formLabel} htmlFor="assign-role-select">
                Platform role
              </label>
              <select
                id="assign-role-select"
                className={modalStyles.formSelect}
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                disabled={acting}
              >
                <option value="">Select role…</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {getRoleLabel(r.name ?? "")}
                  </option>
                ))}
              </select>
            </div>
            <div className={modalStyles.modalActions}>
              <button
                type="button"
                className={modalStyles.cancelBtn}
                onClick={() => setAssignAdminId(null)}
                disabled={acting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={modalStyles.primaryBtn}
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
