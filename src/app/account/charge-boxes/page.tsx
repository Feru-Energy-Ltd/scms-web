"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fetchChargingStations } from "@/lib/api/chargingStations";
import { asArray } from "@/lib/api/normalize";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
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
  const [size] = useState(20);
  const [rows, setRows] = useState<ChargerRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await fetchChargingStations(page, size);
      setRows(asArray<ChargerRow>(raw));
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load charge boxes." });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <h1 className={styles.h1}>Charge boxes</h1>
      <p className={styles.muted}>Charging stations linked to your account.</p>

      <div className={styles.toolbar}>
        <Link href="/account/charge-boxes/create" className={styles.buttonPrimary}>
          New charger
        </Link>
        <button type="button" className={styles.button} onClick={() => void load()}>
          Refresh
        </button>
        <button
          type="button"
          className={styles.button}
          disabled={page <= 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          Previous
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
        <span className={styles.muted}>Page {page + 1}</span>
      </div>

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
                <th className={styles.th}>Address</th>
                <th className={styles.th}>Latitude</th>
                <th className={styles.th}>Longitude</th>
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
                    <td className={styles.td}>{cell(row, "address")}</td>
                    <td className={styles.td}>
                      {cell(row, "locationLatitude", "latitude")}
                    </td>
                    <td className={styles.td}>
                      {cell(row, "locationLongitude", "longitude")}
                    </td>
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
        </div>
      )}
    </div>
  );
}
