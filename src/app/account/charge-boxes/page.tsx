"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fetchChargeBoxes } from "@/lib/api/chargeBoxes";
import { asArray } from "@/lib/api/normalize";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import Pagination from "@/components/account/Pagination";
import PageHeader from "@/components/account/PageHeader";
import styles from "@/components/account/ResourceList.module.css";

type ChargerRow = Record<string, unknown>;

function cell(row: ChargerRow, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v != null && v !== "") return String(v);
  }
  return "—";
}

export default function AccountChargeBoxesPage() {
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [rows, setRows] = useState<ChargerRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = (await fetchChargeBoxes(page, 5)) as { totalPages?: number };
      setRows(asArray<ChargerRow>(raw));
      setTotalPages(raw?.totalPages ?? 0);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load charge boxes." });
      setRows([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Charge boxes"
        description="Charging stations linked to your account."
        addHref="/account/charge-boxes/create"
        addLabel="New charger"
      />

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : rows.length === 0 ? (
        <p className={styles.muted}>No charge boxes.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Charge box id</th>
                <th className={styles.th}>Station</th>
                <th className={styles.th}>Address</th>
                <th className={styles.th}>Registration</th>
                <th className={styles.th}>Online</th>
                <th className={styles.th} />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const id =
                  cell(row, "chargeBoxId", "id", "chargerId") || String(i);
                const reg = cell(row, "registrationStatus", "registration");
                const accepted =
                  reg.toLowerCase() === "accepted" || reg === "ACCEPTED";
                return (
                  <tr key={`${id}-${i}`}>
                    <td className={styles.td}>
                      {cell(row, "chargeBoxId", "id")}
                    </td>
                    <td className={styles.td}>
                      {cell(row, "stationId")}
                    </td>
                    <td className={styles.td}>{cell(row, "address")}</td>
                    <td className={styles.td}>
                      <span
                        className={accepted ? styles.badgeOk : styles.badgeNo}
                      >
                        {reg}
                      </span>
                    </td>
                    <td className={styles.td}>
                      {cell(row, "onlineStatus", "online", "status")}
                    </td>
                    <td className={styles.td}>
                      <Link
                        href={`/account/charge-boxes/update/${encodeURIComponent(id)}`}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
