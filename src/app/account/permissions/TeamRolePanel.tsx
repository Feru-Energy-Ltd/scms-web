"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  fetchProviderStaff,
  updateStaffRole,
  type ProviderStaffRole,
  type StaffMember,
} from "@/lib/api/providerUsers";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import { getRoleLabel } from "@/lib/auth/roles";
import { getStoredPermissions } from "@/lib/auth/session";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";
import userStyles from "../users/users.module.css";
import EditRoleModal from "../users/EditRoleModal";
import matrixStyles from "./permissions.module.css";

const ASSIGNABLE_ROLES: ProviderStaffRole[] = [
  "SERVICE_PROVIDER_OWNER",
  "SERVICE_PROVIDER_MANAGER",
  "SERVICE_PROVIDER_STAFF",
];

export default function TeamRolePanel() {
  const { providerId, userId: currentUserId } = getAccessTokenContext();
  const perms = new Set(getStoredPermissions());
  const canEditRole = perms.has("provider:roles:update");

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);

  const load = useCallback(async () => {
    if (providerId == null) {
      setStaff([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setStaff(await fetchProviderStaff(providerId));
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Failed to load staff" });
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    void load();
  }, [load]);

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
    if (providerId == null || !editTarget) return;
    setActing(true);
    try {
      await updateStaffRole(providerId, editTarget.userId, role);
      toast.success(`${editTarget.displayName}'s role updated to ${getRoleLabel(role)}`);
      setEditTarget(null);
      await load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Failed to update role" });
    } finally {
      setActing(false);
    }
  }

  const grouped = ASSIGNABLE_ROLES.map((role) => ({
    role,
    members: staff.filter((s) => s.role === role && s.status === "ACTIVE"),
  }));

  return (
    <section className={matrixStyles.teamPanel}>
      <div className={matrixStyles.teamPanelHeader}>
        <div>
          <h2 className={matrixStyles.teamPanelTitle}>Assign team roles</h2>
          <p className={styles.muted}>
            {canEditRole
              ? "Change which role each staff member has in your organization."
              : "You can view team role assignments. Only owners can change roles."}
          </p>
        </div>
        <Link href="/account/users" className={styles.button}>
          Full staff management
        </Link>
      </div>

      {loading ? (
        <p className={styles.muted}>Loading team…</p>
      ) : (
        <div className={matrixStyles.teamGroups}>
          {grouped.map(({ role, members }) => (
            <div key={role} className={matrixStyles.teamGroup}>
              <h3 className={matrixStyles.teamGroupTitle}>
                {getRoleLabel(role)}{" "}
                <span className={styles.muted}>({members.length})</span>
              </h3>
              {members.length === 0 ? (
                <p className={styles.muted}>No active members</p>
              ) : (
                <ul className={matrixStyles.teamList}>
                  {members.map((m) => (
                    <li key={m.userId} className={matrixStyles.teamListItem}>
                      <span>
                        {m.displayName || m.email}
                        <span className={styles.muted}> · {m.email}</span>
                      </span>
                      {canEditRole && canModify(m) && (
                        <button
                          type="button"
                          className={userStyles.actionBtn}
                          onClick={() => setEditTarget(m)}
                        >
                          Change role
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
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
    </section>
  );
}
