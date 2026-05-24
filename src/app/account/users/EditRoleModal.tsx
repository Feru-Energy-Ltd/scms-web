"use client";

import { useState } from "react";
import type { ProviderStaffRole, StaffMember } from "@/lib/api/providerUsers";
import styles from "./users.module.css";

interface Props {
  staff: StaffMember;
  callerIsOwner: boolean;
  loading: boolean;
  onSave: (role: ProviderStaffRole) => void;
  onCancel: () => void;
}

const ALL_ROLES: { value: ProviderStaffRole; label: string }[] = [
  { value: "SERVICE_PROVIDER_OWNER", label: "Owner" },
  { value: "SERVICE_PROVIDER_MANAGER", label: "Manager" },
  { value: "SERVICE_PROVIDER_STAFF", label: "Staff" },
];

export default function EditRoleModal({ staff, callerIsOwner, loading, onSave, onCancel }: Props) {
  const roleOptions = callerIsOwner
    ? ALL_ROLES
    : ALL_ROLES.filter((r) => r.value !== "SERVICE_PROVIDER_OWNER");
  const [selectedRole, setSelectedRole] = useState<ProviderStaffRole>(
    staff.role as ProviderStaffRole,
  );

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Edit Staff Role</h2>

        <div className={styles.modalField}>
          <span className={styles.fieldLabel}>Name</span>
          <span>{staff.displayName}</span>
        </div>
        <div className={styles.modalField}>
          <span className={styles.fieldLabel}>Email</span>
          <span>{staff.email}</span>
        </div>
        <div className={styles.modalField}>
          <span className={styles.fieldLabel}>Role</span>
          <select
            className={styles.roleSelect}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as ProviderStaffRole)}
            disabled={loading}
          >
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className={styles.primaryBtn}
            onClick={() => onSave(selectedRole)}
            disabled={loading || selectedRole === staff.role}
          >
            {loading ? "Saving..." : "Save Role"}
          </button>
        </div>
      </div>
    </div>
  );
}
