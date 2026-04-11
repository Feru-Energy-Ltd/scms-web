"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchOrganizations } from "@/lib/api/organizations";
import { asArray } from "@/lib/api/normalize";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";

type OrgRow = Record<string, unknown>;

function cell(row: OrgRow, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v != null && v !== "") return String(v);
  }
  return "—";
}

export default function AccountOrganisationsPage() {
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [rows, setRows] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await fetchOrganizations({
        search: applied || undefined,
        page,
        size,
      });
      setRows(asArray<OrgRow>(raw));
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load organisations." });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [applied, page, size]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <h1 className={styles.h1}>Organisations</h1>
      <p className={styles.muted}>Service providers and organisation directory.</p>

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
        <button
          type="button"
          className={styles.button}
          disabled={page <= 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          Previous page
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => setPage((p) => p + 1)}
        >
          Next page
        </button>
        <span className={styles.muted}>Page {page + 1}</span>
      </div>

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : rows.length === 0 ? (
        <p className={styles.muted}>No organisations.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Address</th>
                <th className={styles.th}>Website</th>
                <th className={styles.th}>TIN</th>
                <th className={styles.th}>Email</th>
                <th className={styles.th}>Type</th>
                <th className={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const id = cell(row, "id");
                const active = row.active;
                const activeBool =
                  typeof active === "boolean"
                    ? active
                    : active === "true" || active === 1;
                const web = cell(row, "websiteUrl", "website");
                return (
                  <tr key={`${id}-${i}`}>
                    <td className={styles.td}>{cell(row, "name")}</td>
                    <td className={styles.td}>{cell(row, "address")}</td>
                    <td className={styles.td}>
                      {web !== "—" ? (
                        <a href={web} target="_blank" rel="noreferrer">
                          {web}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={styles.td}>{cell(row, "tin")}</td>
                    <td className={styles.td}>{cell(row, "email")}</td>
                    <td className={styles.td}>{cell(row, "type")}</td>
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
