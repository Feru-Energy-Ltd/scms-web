"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  fetchStationsPage,
  type ChargingStation,
} from "@/lib/api/stations";
import { fetchServiceProviders } from "@/lib/api/serviceProviders";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import Pagination from "@/components/account/Pagination";
import PageHeader from "@/components/account/PageHeader";
import styles from "@/components/account/ResourceList.module.css";

function providerLabel(
  providerId: number | null | undefined,
  names: Map<number, string>,
) {
  if (providerId == null) return "—";
  return names.get(providerId) ?? String(providerId);
}

export default function ChargingStationsPage() {
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [providerNames, setProviderNames] = useState<Map<number, string>>(
    () => new Map(),
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchStationsPage(page, 5);
      setStations(res.content ?? []);
      setTotalPages(res.totalPages ?? 0);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load stations." });
      setStations([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetchServiceProviders({ page: 0, size: 500 });
        if (!alive) return;
        const map = new Map<number, string>();
        for (const p of res.content ?? []) {
          map.set(p.id, p.businessName || p.displayName);
        }
        setProviderNames(map);
      } catch {
        // Non-fatal: table falls back to provider id.
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Charging stations"
        description="Physical sites that group one or more chargeboxes."
        addLabel="New station"
        addHref="/account/stations/new"
      />

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : stations.length === 0 ? (
        <p className={styles.muted}>
          No charging stations yet. Create one above, or add a charger (a station
          is created automatically).
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Station id</th>
                <th className={styles.th}>Provider</th>
                <th className={styles.th}>Address</th>
                <th className={styles.th}>Latitude</th>
                <th className={styles.th}>Longitude</th>
                <th className={styles.th}>Image</th>
                <th className={styles.th}>Chargers</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((s) => (
                <tr key={s.id}>
                  <td className={styles.td}>{s.stationId}</td>
                  <td className={styles.td}>
                    {providerLabel(s.providerId, providerNames)}
                  </td>
                  <td className={styles.td}>{s.locationAddressName || "—"}</td>
                  <td className={styles.td}>{s.locationLatitude || "—"}</td>
                  <td className={styles.td}>{s.locationLongitude || "—"}</td>
                  <td className={styles.td}>
                    {s.imageUrl ? (
                      <a href={s.imageUrl} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={styles.td}>{s.chargeBoxCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <p className={styles.muted} style={{ marginTop: 16 }}>
        Manage individual chargeboxes under{" "}
        <Link href="/account/charge-boxes">Charge Boxes</Link>.
      </p>
    </div>
  );
}
