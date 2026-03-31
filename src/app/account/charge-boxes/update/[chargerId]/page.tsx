"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { fetchChargingStationById } from "@/lib/api/chargingStations";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";

export default function UpdateChargeBoxPage() {
  const params = useParams<{ chargerId: string }>();
  const chargerId = params?.chargerId ?? "";
  const [payload, setPayload] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!chargerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const raw = await fetchChargingStationById(
        decodeURIComponent(chargerId),
      );
      setPayload(raw);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load charger." });
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [chargerId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/account">Dashboard</Link>
        <span>/</span>
        <Link href="/account/charge-boxes">Charge boxes</Link>
        <span>/</span>
        <span>Update</span>
      </nav>

      <h1 className={styles.h1}>Update charger</h1>
      <p className={styles.muted}>Id: {decodeURIComponent(chargerId)}</p>

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : payload == null ? (
        <p className={styles.error}>No data.</p>
      ) : (
        <>
          <p className={styles.muted}>
            Raw API response (editing flows can be layered on this).
          </p>
          <pre className={styles.pre}>
            {JSON.stringify(payload, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}
