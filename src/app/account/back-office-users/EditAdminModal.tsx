"use client";

import { useState } from "react";
import type { SystemAdminUser, UpdateSystemAdminRequest } from "@/lib/api/backOfficeUsers";
import styles from "./back-office-users.module.css";

interface Props {
  admin: SystemAdminUser;
  loading: boolean;
  onSave: (data: UpdateSystemAdminRequest) => void;
  onCancel: () => void;
}

export default function EditAdminModal({ admin, loading, onSave, onCancel }: Props) {
  const [displayName, setDisplayName] = useState(admin.displayName ?? "");
  const [employeeId, setEmployeeId] = useState(admin.employeeId ?? "");
  const [department, setDepartment] = useState(admin.department ?? "");

  function handleSubmit() {
    onSave({
      displayName: displayName.trim(),
      employeeId: employeeId.trim() || undefined,
      department: department.trim() || undefined,
    });
  }

  const valid = displayName.trim().length > 0;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Edit back-office user</h2>

        <div className={styles.formField}>
          <span className={styles.formLabel}>Email</span>
          <p className={styles.readOnlyValue}>{admin.email}</p>
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="edit-admin-display-name">
            Display name *
          </label>
          <input
            id="edit-admin-display-name"
            className={styles.formInput}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="edit-admin-employee-id">
            Employee ID
          </label>
          <input
            id="edit-admin-employee-id"
            className={styles.formInput}
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="edit-admin-department">
            Department
          </label>
          <input
            id="edit-admin-department"
            className={styles.formInput}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleSubmit}
            disabled={loading || !valid}
          >
            {loading ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
