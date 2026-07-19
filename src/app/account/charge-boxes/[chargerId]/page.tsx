"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ChargerHistoryTabs from "@/components/account/ChargerHistoryTabs";
import ConnectorStatusDot from "@/components/account/ConnectorStatusDot";
import { fetchChargerDetail, type ChargerDetail } from "@/lib/api/chargeBoxes";
import { formatApiUtcDateTime } from "@/lib/datetime/formatUtc";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import listStyles from "@/components/account/ResourceList.module.css";
import styles from "./view.module.css";

export default function AccountChargeBoxViewPage() {
  const params = useParams<{ chargerId: string }>();
  const chargerId = decodeURIComponent(params?.chargerId ?? "");
  const initialTab = useSearchParams().get("tab") ?? "transactions";
  const [charger, setCharger] = useState<ChargerDetail | null>(null);
  const [fetchedForId, setFetchedForId] = useState<string | null>(null);
  const loading = Boolean(chargerId) && fetchedForId !== chargerId;

  useEffect(() => {
    if (!chargerId) return;
    let alive = true;
    fetchChargerDetail(chargerId)
      .then((c) => {
        if (!alive) return;
        setCharger(c);
        setFetchedForId(chargerId);
      })
      .catch((e) => {
        if (!alive) return;
        showApiErrorToast(e, { fallbackMessage: "Could not load charger." });
        setCharger(null);
        setFetchedForId(chargerId);
      });
    return () => {
      alive = false;
    };
  }, [chargerId]);

  if (!chargerId) {
    return <p className={listStyles.muted}>Missing charger id.</p>;
  }

  if (loading) {
    return <p className={listStyles.muted}>Loading…</p>;
  }

  if (!charger) {
    return (
      <div>
        <p className={listStyles.muted}>Charger not found.</p>
        <Link href="/account/charge-boxes">Back to charge boxes</Link>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <Link href="/account/charge-boxes" className={styles.back}>
          ← Charge boxes
        </Link>
        <Link
          href={`/account/charge-boxes/update/${encodeURIComponent(chargerId)}`}
          className={styles.editLink}
        >
          Edit
        </Link>
      </div>

      <div className={styles.infoCard}>
        <h1>{charger.chargeBoxId}</h1>
        <dl className={styles.specs}>
          <div>
            <dt>Vendor</dt>
            <dd>{charger.chargePointVendor ?? "—"}</dd>
          </div>
          <div>
            <dt>Model</dt>
            <dd>{charger.chargePointModel ?? "—"}</dd>
          </div>
          <div>
            <dt>Serial</dt>
            <dd>{charger.chargePointSerialNumber ?? "—"}</dd>
          </div>
          <div>
            <dt>Firmware</dt>
            <dd>{charger.firmwareVersion ?? "—"}</dd>
          </div>
          <div>
            <dt>OCPP</dt>
            <dd>{charger.ocppProtocol ?? "—"}</dd>
          </div>
          <div>
            <dt>Station</dt>
            <dd>{charger.stationId ?? "—"}</dd>
          </div>
          <div>
            <dt>Enabled</dt>
            <dd>{charger.enabled == null ? "—" : charger.enabled ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>Last heartbeat</dt>
            <dd>{formatApiUtcDateTime(charger.lastHeartbeatTimestamp)}</dd>
          </div>
        </dl>
        <ConnectorStatusDot status={charger.onlineStatus ?? "OFFLINE"} />
      </div>

      <ChargerHistoryTabs chargerId={chargerId} initialTab={initialTab} />
    </div>
  );
}
