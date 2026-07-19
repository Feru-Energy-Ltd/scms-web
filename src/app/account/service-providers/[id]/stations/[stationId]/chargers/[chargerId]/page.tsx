"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useBreadcrumbOverrides } from "@/components/account/BreadcrumbContext";
import { useProviderBreadcrumb } from "@/components/account/useProviderBreadcrumb";
import ChargerHistoryTabs from "@/components/account/ChargerHistoryTabs";
import ConnectorStatusDot from "@/components/account/ConnectorStatusDot";
import { fetchChargerDetail, type ChargerDetail } from "@/lib/api/chargeBoxes";
import { formatApiUtcDateTime } from "@/lib/datetime/formatUtc";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "./charger.module.css";

export default function ChargerDetailPage() {
  const { id, stationId, chargerId } = useParams<{
    id: string;
    stationId: string;
    chargerId: string;
  }>();
  const initialTab = useSearchParams().get("tab") ?? "transactions";
  const [charger, setCharger] = useState<ChargerDetail | null>(null);

  useEffect(() => {
    let alive = true;
    fetchChargerDetail(chargerId)
      .then((c) => {
        if (alive) setCharger(c);
      })
      .catch((e) => {
        if (alive) {
          showApiErrorToast(e, { fallbackMessage: "Could not load charger." });
        }
      });
    return () => {
      alive = false;
    };
  }, [chargerId]);

  useProviderBreadcrumb(id);

  useBreadcrumbOverrides(
    useMemo(
      () => ({
        [`/account/service-providers/${id}/stations/${stationId}`]: "Station",
        [`/account/service-providers/${id}/stations/${stationId}/chargers/${chargerId}`]:
          charger?.chargeBoxId ?? "Charger",
      }),
      [id, stationId, chargerId, charger?.chargeBoxId],
    ),
  );

  return (
    <div>
      <div className={styles.infoCard}>
        <h1>{charger?.chargeBoxId ?? "—"}</h1>
        <dl className={styles.specs}>
          <div>
            <dt>Vendor</dt>
            <dd>{charger?.chargePointVendor ?? "—"}</dd>
          </div>
          <div>
            <dt>Model</dt>
            <dd>{charger?.chargePointModel ?? "—"}</dd>
          </div>
          <div>
            <dt>Firmware</dt>
            <dd>{charger?.firmwareVersion ?? "—"}</dd>
          </div>
          <div>
            <dt>Last heartbeat</dt>
            <dd>{formatApiUtcDateTime(charger?.lastHeartbeatTimestamp)}</dd>
          </div>
        </dl>
        <ConnectorStatusDot status={charger?.onlineStatus ?? "OFFLINE"} />
        {/* Reboot CTA deferred — requires OCPP Reset wiring */}
      </div>

      <ChargerHistoryTabs chargerId={chargerId} initialTab={initialTab} />
    </div>
  );
}
