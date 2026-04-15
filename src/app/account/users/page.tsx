"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchOrganizationUsers } from "@/lib/api/organizations";
import { fetchProviderUsers } from "@/lib/api/providerUsers";
import { asArray } from "@/lib/api/normalize";
import {
  getOrganizationIdFromAccessToken,
  getProviderIdFromAccessToken,
} from "@/lib/auth/jwtContext";
import { getStoredIdentityType } from "@/lib/auth/session";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";

type OrgUserRow = Record<string, unknown>;

function cell(row: OrgUserRow, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v != null && v !== "") return String(v);
  }
  return "—";
}

export default function AccountUsersPage() {
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [rows, setRows] = useState<OrgUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const identityType = getStoredIdentityType();
  const orgId = getOrganizationIdFromAccessToken();
  const providerId = getProviderIdFromAccessToken();

  const load = useCallback(async () => {
    if (identityType === "SERVICE_PROVIDER" && providerId == null) {
      setRows([]);
      setLoading(false);
      setError(
        "No provider id found on the access token. Users list requires a provider-scoped session.",
      );
      return;
    }

    if (identityType !== "SERVICE_PROVIDER" && orgId == null) {
      setRows([]);
      setLoading(false);
      setError(
        "No organization id found on the access token. Users list requires an org-scoped session.",
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (identityType === "SERVICE_PROVIDER" && providerId != null) {
        const raw = await fetchProviderUsers(providerId);
        const staffRows = asArray<OrgUserRow>(raw);
        const q = applied.trim().toLowerCase();
        const filtered = q
          ? staffRows.filter((row) =>
              [cell(row, "displayName"), cell(row, "email"), cell(row, "role")]
                .join(" ")
                .toLowerCase()
                .includes(q),
            )
          : staffRows;
        setRows(filtered);
      } else {
        const raw = await fetchOrganizationUsers(orgId!, applied || undefined);
        setRows(asArray<OrgUserRow>(raw));
      }
    } catch (e) {
      setError("Could not load users.");
      showApiErrorToast(e, { fallbackMessage: "Could not load users." });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [identityType, providerId, orgId, applied]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <h1 className={styles.h1}>Back office users</h1>
      <p className={styles.muted}>
        {identityType === "SERVICE_PROVIDER"
          ? `Provider staff for provider id: ${providerId ?? "—"}`
          : `Organization members for org id: ${orgId ?? "—"}`}
      </p>

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setApplied(search.trim());
          }}
        />
        <button
          type="button"
          className={styles.button}
          onClick={() => setApplied(search.trim())}
        >
          Search
        </button>
        <button type="button" className={styles.button} onClick={() => void load()}>
          Refresh
        </button>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : rows.length === 0 ? (
        <p className={styles.muted}>No users to show.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Email</th>
                <th className={styles.th}>Phone</th>
                <th className={styles.th}>Role</th>
                <th className={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const id = cell(row, "id", "userId");
                const active = row.active;
                const activeBool =
                  identityType === "SERVICE_PROVIDER"
                    ? cell(row, "status") === "ACTIVE"
                    : typeof active === "boolean"
                      ? active
                      : active === "true" || active === 1;
                return (
                  <tr key={`${id}-${i}`}>
                    <td className={styles.td}>
                      {cell(row, "firstName", "lastName")
                        ? `${cell(row, "firstName")} ${cell(row, "lastName")}`.trim()
                        : cell(row, "displayName", "name", "username")}
                    </td>
                    <td className={styles.td}>{cell(row, "email")}</td>
                    <td className={styles.td}>
                      {identityType === "SERVICE_PROVIDER"
                        ? "—"
                        : cell(row, "phoneNumber", "phone")}
                    </td>
                    <td className={styles.td}>
                      {cell(row, "roles", "role", "roleName")}
                    </td>
                    <td className={styles.td}>
                      <span
                        className={activeBool ? styles.badgeOk : styles.badgeNo}
                      >
                        {activeBool ? "Active" : "Inactive"}
                      </span>
                    </td>
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
