"use client";

import { useEffect, useState } from "react";
import DataTable, { type DataTableColumn } from "@/components/account/DataTable";
import { SkeletonTable } from "@/components/account/Skeleton";
import Tabs from "@/components/account/Tabs";
import listStyles from "@/components/account/ResourceList.module.css";
import {
  fetchChargerBookings,
  fetchChargerTransactions,
  type ChargerBooking,
  type ChargerTransaction,
} from "@/lib/api/chargeBoxes";
import { formatApiUtcDateTime } from "@/lib/datetime/formatUtc";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";

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
        if (alive) {
          showApiErrorToast(e, {
            fallbackMessage: "Could not load transactions.",
          });
        }
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
  if (rows.length === 0) {
    return <p className={listStyles.muted}>No transactions.</p>;
  }
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
        if (alive) {
          showApiErrorToast(e, { fallbackMessage: "Could not load bookings." });
        }
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
  if (rows.length === 0) {
    return <p className={listStyles.muted}>No bookings.</p>;
  }
  return <DataTable columns={cols} rows={rows} getRowKey={(r) => r.id} />;
}

export default function ChargerHistoryTabs({
  chargerId,
  initialTab = "transactions",
}: {
  chargerId: string;
  initialTab?: string;
}) {
  return (
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
  );
}
