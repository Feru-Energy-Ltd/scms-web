"use client";

import { useCallback, useState } from "react"; 
import { fetchProviderUsers } from "@/lib/api/providerUsers";
import { asArray } from "@/lib/api/normalize";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";

type ProviderUserRow = Record<string, unknown>;

function cell(row: ProviderUserRow, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v != null && v !== "") return String(v);
  }
  return "—";
}

export default function AccountUsersPage() {
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [rows, setRows] = useState<ProviderUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { identityType, email } = getAccessTokenContext();

  const load = useCallback(async () => {
    if (identityType !== "SERVICE_PROVIDER") {
      setRows([]);
      setLoading(false);
      setError(
        "No provider id found on the access token. Users list requires a provider-scoped session.",
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const raw = await fetchProviderUsers(Number(email));
      setRows(asArray(raw));
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load users." });
    }
  }, []);

  return (
    <div>
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
