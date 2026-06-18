"use client";

import { useState } from "react";
import type { CreateSystemAdminRequest } from "@/lib/api/backOfficeUsers";
import { getRoleLabel } from "@/lib/auth/roles";
import styles from "./back-office-users.module.css";

type RoleOption = { id: number; name: string };

interface Props {
  roles: RoleOption[];
  loading: boolean;
  onSave: (data: CreateSystemAdminRequest) => void;
  onCancel: () => void;
}

export default function CreateAdminModal({ roles, loading, onSave, onCancel }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  function toggleRole(roleId: number) {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    );
  }

  function handleSubmit() {
    onSave({
      email: email.trim(),
      password,
      displayName: displayName.trim(),
      employeeId: employeeId.trim() || undefined,
      department: department.trim() || undefined,
      roleIds: selectedRoleIds.length > 0 ? selectedRoleIds : undefined,
    });
  }

  const valid =
    email.trim() &&
    password.length >= 8 &&
    displayName.trim();

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Create back-office user</h2>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="admin-display-name">
            Display name *
          </label>
          <input
            id="admin-display-name"
            className={styles.formInput}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Jane Doe"
            disabled={loading}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="admin-email">
            Email *
          </label>
          <input
            id="admin-email"
            className={styles.formInput}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@safaricharge.com"
            disabled={loading}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="admin-password">
            Password *
          </label>
          <input
            id="admin-password"
            className={styles.formInput}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            minLength={8}
            disabled={loading}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="admin-employee-id">
            Employee ID
          </label>
          <input
            id="admin-employee-id"
            className={styles.formInput}
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="EMP-001"
            disabled={loading}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="admin-department">
            Department
          </label>
          <input
            id="admin-department"
            className={styles.formInput}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Operations"
            disabled={loading}
          />
        </div>

        {roles.length > 0 && (
          <div className={styles.formField}>
            <span className={styles.formLabel}>Platform roles</span>
            <div className={styles.roleGrid}>
              {roles.map((role) => (
                <label key={role.id} className={styles.roleOption}>
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                    disabled={loading}
                  />
                  {getRoleLabel(role.name)}
                </label>
              ))}
            </div>
          </div>
        )}

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
            {loading ? "Creating…" : "Create user"}
          </button>
        </div>
      </div>
    </div>
  );
}
