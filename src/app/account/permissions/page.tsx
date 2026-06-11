"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAdminRoles, fetchProviderRoles } from "@/lib/api/security";
import { asArray } from "@/lib/api/normalize";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import { getStoredPermissions } from "@/lib/auth/session";
import {
  ADMIN_MATRIX_COLUMNS,
  buildAdminMatrix,
  buildProviderMatrix,
  MATRIX_LEGEND,
  PROVIDER_MATRIX_COLUMNS,
  type RoleMatrixRow,
  type RolePermissionRow,
} from "@/lib/security/permissionMatrix";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";
import PermissionMatrixView from "./PermissionMatrixView";
import TeamRolePanel from "./TeamRolePanel";
import matrixStyles from "./permissions.module.css";

type RoleRow = Record<string, unknown>;

function toRolePermissionRows(raw: RoleRow[]): RolePermissionRow[] {
  const rows: RolePermissionRow[] = [];
  for (const row of raw) {
    const name = row.name;
    if (typeof name !== "string" || !name) continue;
    const perms = row.permissions;
    const permissions = Array.isArray(perms) ? perms.map(String) : [];
    rows.push({ name, permissions });
  }
  return rows;
}

export default function AccountPermissionsPage() {
  const [matrixRows, setMatrixRows] = useState<RoleMatrixRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"admin" | "provider">("admin");

  const { providerId } = useMemo(() => getAccessTokenContext(), []);
  const perms = useMemo(() => new Set(getStoredPermissions()), []);
  const canAssignProviderRoles = perms.has("provider:roles:update");
  const canAssignAdminRoles =
    perms.has("admin:roles:update") || perms.has("admin:roles:create");

  const columns = viewMode === "provider" ? PROVIDER_MATRIX_COLUMNS : ADMIN_MATRIX_COLUMNS;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (perms.has("admin:roles:read")) {
        setViewMode("admin");
        const raw = await fetchAdminRoles();
        setMatrixRows(buildAdminMatrix(toRolePermissionRows(asArray<RoleRow>(raw))));
      } else if (perms.has("provider:roles:read") && providerId != null) {
        setViewMode("provider");
        const raw = await fetchProviderRoles(providerId);
        setMatrixRows(buildProviderMatrix(toRolePermissionRows(asArray<RoleRow>(raw))));
      } else {
        setMatrixRows([]);
      }
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load roles." });
      setMatrixRows([]);
    } finally {
      setLoading(false);
    }
  }, [perms, providerId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <h1 className={styles.h1}>Roles and permissions</h1>
      <p className={styles.muted}>
        {viewMode === "provider"
          ? "Reference matrix for your organization’s roles. Assign staff below."
          : "Reference matrix for platform roles. Role templates are defined by the system."}
      </p>

      {viewMode === "admin" && canAssignAdminRoles && (
        <div className={matrixStyles.infoCard}>
          <p className={matrixStyles.infoCardTitle}>Assign platform roles to users</p>
          <p className={styles.muted}>
            Use back-office user administration to assign Master, Manager, Staff, and other
            platform roles to system admin accounts. This page shows what each role can do.
          </p>
        </div>
      )}

      <div className={styles.toolbar}>
        <button type="button" className={styles.button} onClick={() => void load()}>
          Refresh
        </button>
      </div>

      <div className={matrixStyles.legend} aria-label="Permission shorthand legend">
        {MATRIX_LEGEND.map((item) => (
          <span key={item.code} className={matrixStyles.legendItem}>
            <span className={matrixStyles.legendCode}>{item.code}</span>
            <span>{item.meaning}</span>
          </span>
        ))}
      </div>

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : matrixRows.length === 0 ? (
        <p className={styles.muted}>No roles.</p>
      ) : (
        <PermissionMatrixView rows={matrixRows} columns={columns} />
      )}

      <div className={matrixStyles.notes}>
        {viewMode === "provider" ? (
          <>
            <strong>Notes</strong>
            <ul>
              <li>Role capabilities above apply within your organization only.</li>
              <li>Hover a cell to see underlying permission keys.</li>
              {canAssignProviderRoles ? (
                <li>Use the panel below to assign Owner, Manager, or Staff to team members.</li>
              ) : (
                <li>Only owners can change staff role assignments.</li>
              )}
            </ul>
          </>
        ) : (
          <>
            <strong>Notes</strong>
            <ul>
              <li>This matrix is read-only; it reflects platform role definitions from the backend.</li>
              <li>Hover a cell to see underlying permission keys.</li>
              <li>Assign roles to back-office users through system admin management.</li>
            </ul>
          </>
        )}
      </div>

      {viewMode === "provider" && <TeamRolePanel />}
    </div>
  );
}
