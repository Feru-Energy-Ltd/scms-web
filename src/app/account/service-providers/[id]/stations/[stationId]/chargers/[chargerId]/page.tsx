"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useBreadcrumbOverrides } from "@/components/account/BreadcrumbContext";
import { useProviderBreadcrumb } from "@/components/account/useProviderBreadcrumb";
import Tabs from "@/components/account/Tabs";
import DataTable, { type DataTableColumn } from "@/components/account/DataTable";
import { SkeletonTable } from "@/components/account/Skeleton";
import ConnectorStatusDot from "@/components/account/ConnectorStatusDot";
import {
  fetchChargerDetail,
  fetchChargerTransactions,
  fetchChargerBookings,
  type ChargerDetail,
  type ChargerTransaction,
  type ChargerBooking,
} from "@/lib/api/chargeBoxes";
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
        if (alive) showApiErrorToast(e, { fallbackMessage: "Could not load charger." });
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
            <dd>
              {charger?.lastHeartbeatTimestamp
                ? new Date(charger.lastHeartbeatTimestamp).toLocaleString()
                : "—"}
            </dd>
          </div>
        </dl>
        <ConnectorStatusDot status={charger?.onlineStatus ?? "OFFLINE"} />
        {/* Reboot CTA deferred — requires OCPP Reset wiring */}
      </div>

      <Tabs
        initialId={initialTab}
        tabs={[
          {
            id: "transactions",
            label: "Transaction History",
            content: <TransactionsTab chargerId={chargerId} />,
          },
          {
            id: "bookings",
            label: "Booking History",
            content: <BookingsTab chargerId={chargerId} />,
          },
        ]}
      />
    </div>
  );
}

function TransactionsTab({ chargerId }: { chargerId: string }) {
  const [rows, setRows] = useState<ChargerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    fetchChargerTransactions(chargerId)
      .then((p) => {
        if (alive) setRows(p.content ?? []);
      })
      .catch((e) => {
        if (alive) showApiErrorToast(e, { fallbackMessage: "Could not load transactions." });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [chargerId]);
  const cols: DataTableColumn<ChargerTransaction>[] = [
    { id: "n", header: "#", cell: (_r, i) => i + 1 },
    { id: "txn", header: "Txn ID", cell: (r) => r.transactionId ?? r.id },
    { id: "user", header: "User", cell: (r) => r.walletAccountNumber ?? "—" },
    { id: "conn", header: "Connector", cell: (r) => r.connectorId ?? "—" },
    { id: "kwh", header: "Energy (kWh)", cell: (r) => r.energyKwh ?? "—" },
    { id: "amt", header: "Amount", cell: (r) => r.totalDriverCost ?? "—" },
    { id: "status", header: "Payment Status", cell: (r) => r.status ?? "—" },
    {
      id: "start",
      header: "Start",
      cell: (r) => formatApiUtcDateTime(r.startedAt),
    },
    {
      id: "end",
      header: "End",
      cell: (r) => formatApiUtcDateTime(r.stoppedAt),
    },
  ];
  if (loading) return <SkeletonTable cols={9} />;
  if (rows.length === 0) return <p>No transactions.</p>;
  return <DataTable columns={cols} rows={rows} getRowKey={(r) => r.id} />;
}

function BookingsTab({ chargerId }: { chargerId: string }) {
  const [rows, setRows] = useState<ChargerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    fetchChargerBookings(chargerId)
      .then((p) => {
        if (alive) setRows(p.content ?? []);
      })
      .catch((e) => {
        if (alive) showApiErrorToast(e, { fallbackMessage: "Could not load bookings." });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [chargerId]);
  const cols: DataTableColumn<ChargerBooking>[] = [
    { id: "n", header: "#", cell: (_r, i) => i + 1 },
    { id: "bk", header: "Booking ID", cell: (r) => r.id },
    { id: "user", header: "User", cell: (r) => r.username },
    { id: "conn", header: "Connector", cell: (r) => r.connectorId },
    {
      id: "start",
      header: "Scheduled Start",
      cell: (r) => formatApiUtcDateTime(r.scheduledStart),
    },
    {
      id: "end",
      header: "Scheduled End",
      cell: (r) => formatApiUtcDateTime(r.scheduledEnd),
    },
    { id: "status", header: "Status", cell: (r) => r.status },
  ];
  if (loading) return <SkeletonTable cols={7} />;
  if (rows.length === 0) return <p>No bookings.</p>;
  return <DataTable columns={cols} rows={rows} getRowKey={(r) => r.id} />;
}
