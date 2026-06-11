"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAdminRoles, fetchProviderRoles } from "@/lib/api/security";
import { asArray } from "@/lib/api/normalize";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import { getRoleLabel } from "@/lib/auth/roles";
import { getStoredPermissions } from "@/lib/auth/session";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";

type RoleRow = Record<string, unknown>;

function cell(row: RoleRow, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v != null && v !== "") return String(v);
  }
  return "—";
}

export default function AccountPermissionsPage() {
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProviderView, setIsProviderView] = useState(false);

  const { providerId } = useMemo(() => getAccessTokenContext(), []);
  const perms = useMemo(() => new Set(getStoredPermissions()), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (perms.has("admin:roles:read")) {
        setIsProviderView(false);
        const raw = await fetchAdminRoles();
        setRows(asArray<RoleRow>(raw));
      } else if (perms.has("provider:roles:read") && providerId != null) {
        setIsProviderView(true);
        const raw = await fetchProviderRoles(providerId);
        setRows(asArray<RoleRow>(raw));
      } else {
        setRows([]);
      }
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load roles." });
      setRows([]);
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
        {isProviderView
          ? "View role definitions and permission mappings for your organization."
          : "Manage role definitions and permission mappings."}
      </p>

      <div className={styles.toolbar}>
        <button type="button" className={styles.button} onClick={() => void load()}>
          Refresh
        </button>
      </div>

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : rows.length === 0 ? (
        <p className={styles.muted}>No roles.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {!isProviderView && <th className={styles.th}>Id</th>}
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Permissions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const id = cell(row, "id");
                const name = cell(row, "name");
                const perms = row.permissions;
                let permSummary = "—";
                if (Array.isArray(perms)) {
                  permSummary =
                    perms.length <= 3
                      ? perms.map((p) => (typeof p === "string" ? p : JSON.stringify(p))).join(", ")
                      : `${perms.length} items`;
                }
                return (
                  <tr key={`${id}-${name}-${i}`}>
                    {!isProviderView && <td className={styles.td}>{id}</td>}
                    <td className={styles.td}>{getRoleLabel(name)}</td>
                    <td className={styles.td}>{permSummary}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
