"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAdminRoles } from "@/lib/api/security";
import { asArray } from "@/lib/api/normalize";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import { getStoredPermissions } from "@/lib/auth/session";
import {
  ADMIN_MATRIX_COLUMNS,
  buildAdminMatrix,
  MATRIX_LEGEND,
  type RoleMatrixRow,
  type RolePermissionRow,
} from "@/lib/security/permissionMatrix";
import { isHiddenRole } from "@/lib/auth/roles";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";
import PermissionMatrixView from "./PermissionMatrixView";
import matrixStyles from "./permissions.module.css";

type RoleRow = Record<string, unknown>;

const ALLOWED_ROLES = new Set([
  "SYSTEM_ADMIN_MASTER",
  "SYSTEM_ADMIN_MANAGER",
]);

function toRolePermissionRows(raw: RoleRow[]): RolePermissionRow[] {
  const rows: RolePermissionRow[] = [];
  for (const row of raw) {
    const name = row.name;
    if (typeof name !== "string" || !name || isHiddenRole(name)) continue;
    const perms = row.permissions;
    const permissions = Array.isArray(perms) ? perms.map(String) : [];
    rows.push({ name, permissions });
  }
  return rows;
}

export default function AccountPermissionsPage() {
  const [matrixRows, setMatrixRows] = useState<RoleMatrixRow[]>([]);
  const [loading, setLoading] = useState(true);

  const userCtx = useMemo(() => getAccessTokenContext(), []);
  const perms = useMemo(() => new Set(getStoredPermissions()), []);
  const canView = useMemo(() => {
    const roles = userCtx.roles?.length
      ? userCtx.roles
      : userCtx.role
        ? [userCtx.role]
        : [];
    return (
      perms.has("admin:roles:read") &&
      roles.some((role) => ALLOWED_ROLES.has(role))
    );
  }, [perms, userCtx.roles, userCtx.role]);

  const load = useCallback(async () => {
    if (!canView) {
      setMatrixRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const raw = await fetchAdminRoles();
      setMatrixRows(buildAdminMatrix(toRolePermissionRows(asArray<RoleRow>(raw))));
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load roles." });
      setMatrixRows([]);
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!canView) {
    return (
      <div>
        <h1 className={styles.h1}>Roles and permissions</h1>
        <p className={styles.muted}>
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className={styles.h1}>Roles and permissions</h1>
      <p className={styles.muted}>
        Reference matrix for what each role can do. Use the sidebar to assign roles to users.
      </p>

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
        <PermissionMatrixView rows={matrixRows} columns={ADMIN_MATRIX_COLUMNS} />
      )}

      <div className={matrixStyles.notes}>
        <strong>Notes</strong>
        <ul>
          <li>Hover a cell to see underlying permission keys.</li>
          <li>
            Assign platform roles via <strong>by clicking on Staff</strong> in
            the sidebar.
          </li>
        </ul>
      </div>
    </div>
  );
}
