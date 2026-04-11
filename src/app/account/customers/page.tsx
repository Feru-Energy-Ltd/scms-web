"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchCustomers } from "@/lib/api/customers";
import { asArray } from "@/lib/api/normalize";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";

type CustomerRow = Record<string, unknown>;

function cell(row: CustomerRow, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v != null && v !== "") return String(v);
  }
  return "—";
}

export default function AccountCustomersPage() {
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await fetchCustomers(applied || undefined);
      setRows(asArray<CustomerRow>(raw));
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load customers." });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <h1 className={styles.h1}>Customers</h1>
      <p className={styles.muted}>Customer accounts visible to your session.</p>

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

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : rows.length === 0 ? (
        <p className={styles.muted}>No customers.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Email</th>
                <th className={styles.th}>Phone</th>
                <th className={styles.th}>Sex</th>
                <th className={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const id = cell(row, "id", "customerId");
                const active = row.active;
                const activeBool =
                  typeof active === "boolean"
                    ? active
                    : active === "true" || active === 1;
                return (
                  <tr key={`${id}-${i}`}>
                    <td className={styles.td}>
                      {`${cell(row, "firstName")} ${cell(row, "lastName")}`.trim() ||
                        cell(row, "name")}
                    </td>
                    <td className={styles.td}>{cell(row, "email")}</td>
                    <td className={styles.td}>
                      {cell(row, "phoneNumber", "phone")}
                    </td>
                    <td className={styles.td}>{cell(row, "sex")}</td>
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
