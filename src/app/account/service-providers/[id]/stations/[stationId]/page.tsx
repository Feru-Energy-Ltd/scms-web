"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Breadcrumb from "@/components/account/Breadcrumb";
import DataTable, { type DataTableColumn } from "@/components/account/DataTable";
import MapCard from "@/components/account/MapCard";
import { SkeletonTable } from "@/components/account/Skeleton";
import ConfirmModal from "@/components/account/ConfirmModal";
import {
  fetchStationDetail,
  setChargeBoxEnabled,
  type StationDetail,
  type ChargeBoxSummary,
} from "@/lib/api/stations";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import { getStoredPermissions } from "@/lib/auth/session";
import styles from "./station.module.css";

export default function StationDetailPage() {
  const { id, stationId } = useParams<{ id: string; stationId: string }>();
  const router = useRouter();
  const [station, setStation] = useState<StationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggle, setToggle] = useState<ChargeBoxSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const canManage = getStoredPermissions().includes("admin:chargers:update");

  const load = useCallback(() => {
    setLoading(true);
    return fetchStationDetail(Number(stationId))
      .then(setStation)
      .catch((e) => showApiErrorToast(e, { fallbackMessage: "Could not load station." }))
      .finally(() => setLoading(false));
  }, [stationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyToggle = async () => {
    if (!toggle) return;
    setBusy(true);
    try {
      await setChargeBoxEnabled(toggle.chargeBoxId, !toggle.enabled);
      toast.success(toggle.enabled ? "Charger disabled" : "Charger enabled");
      setToggle(null);
      void load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not change charger status." });
    } finally {
      setBusy(false);
    }
  };

  const base = `/account/service-providers/${id}/stations/${stationId}`;
  const columns: DataTableColumn<ChargeBoxSummary>[] = [
    { id: "n", header: "#", cell: (_r, i) => i + 1 },
    { id: "cb", header: "Charger ID", cell: (r) => r.chargeBoxId },
    { id: "type", header: "Type", cell: (r) => r.currentType ?? "—" },
    { id: "status", header: "Status", cell: (r) => r.onlineStatus ?? "—" },
    { id: "enabled", header: "Enabled", cell: (r) => (r.enabled ? "Yes" : "No") },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <span className={styles.actions}>
          <button className={styles.btn} onClick={() => router.push(`${base}/chargers/${r.chargeBoxId}`)}>
            View
          </button>
          <button
            className={styles.btn}
            onClick={() => router.push(`${base}/chargers/${r.chargeBoxId}?tab=transactions`)}
          >
            Transactions
          </button>
          <button
            className={styles.btn}
            onClick={() => router.push(`${base}/chargers/${r.chargeBoxId}?tab=bookings`)}
          >
            Bookings
          </button>
          {canManage && (
            <button className={styles.btn} onClick={() => setToggle(r)}>
              {r.enabled ? "Disable" : "Enable"}
            </button>
          )}
        </span>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Service Providers", href: "/account/service-providers" },
          { label: "Provider", href: `/account/service-providers/${id}` },
          { label: station?.locationAddressName ?? "Station" },
        ]}
      />
      <div className={styles.cards}>
        <div className={styles.infoCard}>
          <h1>{station?.locationAddressName ?? "—"}</h1>
          <p>
            Chargers: {station?.chargeBoxCount ?? "—"} · Online: {station?.onlineCount ?? "—"}
          </p>
          <p>Status: {station ? (station.enabled ? "Active" : "Disabled") : "—"}</p>
          {/* operating hours / contact deferred — backend fields not yet present */}
        </div>
        <MapCard
          lat={station?.locationLatitude}
          lng={station?.locationLongitude}
          label={station?.locationAddressName}
        />
      </div>

      {loading ? (
        <SkeletonTable cols={6} />
      ) : (
        <DataTable columns={columns} rows={station?.chargeBoxes ?? []} getRowKey={(r) => r.id} />
      )}

      {toggle && (
        <ConfirmModal
          title={toggle.enabled ? "Disable charger" : "Enable charger"}
          message={`${toggle.enabled ? "Disable" : "Enable"} charger ${toggle.chargeBoxId}?`}
          confirmLabel={toggle.enabled ? "Disable" : "Enable"}
          confirmDestructive={toggle.enabled}
          loading={busy}
          onConfirm={applyToggle}
          onCancel={() => setToggle(null)}
        />
      )}
    </div>
  );
}
