"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DataTable, { type DataTableColumn } from "@/components/account/DataTable";
import PageHeader from "@/components/account/PageHeader";
import styles from "@/components/account/ResourceList.module.css";
import { fetchReservations, type ReservationSummary } from "@/lib/api/chargeBoxes";
import {
  fetchActiveProviders,
  type ProviderListItem,
} from "@/lib/api/serviceProviders";
import { asArray } from "@/lib/api/normalize";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";

type ReservationRow = Partial<ReservationSummary> & Record<string, unknown>;

const PAGE_SIZE = 10;

/** Statuses the backend treats as "active" (Accepted / Occupied / Pending). */
const ACTIVE_STATUSES = new Set(["Accepted", "Occupied", "Pending"]);
const FAILED_STATUSES = new Set([
  "Cancelled",
  "Expired",
  "Faulted",
  "Unavailable",
  "Deleted",
]);

function text(value: unknown): string {
  if (value == null || value === "") return "—";
  return String(value);
}

function fmtDateTime(value: unknown): string {
  if (value == null || value === "") return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtMoney(value: unknown): string {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `RWF ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function StatusBadge({ status }: { status: string }) {
  if (ACTIVE_STATUSES.has(status)) {
    return <span className={styles.badgeOk}>{status}</span>;
  }
  if (FAILED_STATUSES.has(status)) {
    return <span className={styles.badgeNo}>{status}</span>;
  }
  return <span className={styles.badge}>{status}</span>;
}

export default function AccountReservationsPage() {
  const [rows, setRows] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // "" = all reservations, "active" = active only.
  const [scopeFilter, setScopeFilter] = useState("active");

  // Admin-only provider drill-down. "" = all providers.
  const isAdmin = useMemo(
    () => getAccessTokenContext()?.identityType === "SYSTEM_ADMIN",
    [],
  );
  const [providerFilter, setProviderFilter] = useState("");
  const [providers, setProviders] = useState<ProviderListItem[]>([]);

  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!isAdmin) return;
    fetchActiveProviders()
      .then(setProviders)
      .catch(() => {});
  }, [isAdmin]);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const providerId =
        providerFilter === "" ? undefined : Number(providerFilter);
      const raw = (await fetchReservations(page, PAGE_SIZE, {
        active: scopeFilter === "active",
        providerId,
      })) as { totalPages?: number };
      if (requestId !== requestIdRef.current) return;
      setRows(asArray<ReservationRow>(raw));
      setTotalPages(raw?.totalPages ?? 0);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      showApiErrorToast(e, { fallbackMessage: "Could not load reservations." });
      setRows([]);
      setTotalPages(0);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, scopeFilter, providerFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo<DataTableColumn<ReservationRow>[]>(
    () => [
      {
        id: "chargeBoxId",
        header: "Charge box",
        cell: (row) => text(row.chargeBoxId),
      },
      {
        id: "connectorId",
        header: "Connector",
        cell: (row) => text(row.connectorId),
      },
      { id: "username", header: "User", cell: (row) => text(row.username) },
      {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={text(row.status)} />,
      },
      {
        id: "scheduledStart",
        header: "Start",
        cell: (row) => fmtDateTime(row.scheduledStart),
      },
      {
        id: "scheduledEnd",
        header: "Expiry",
        cell: (row) => fmtDateTime(row.scheduledEnd),
      },
      {
        id: "reservationAmount",
        header: "Amount",
        cell: (row) => fmtMoney(row.reservationAmount),
      },
      {
        id: "locationAddress",
        header: "Location",
        cell: (row) => text(row.locationAddress),
      },
    ],
    [],
  );

  const filters = useMemo(() => {
    const base = [
      {
        id: "scope",
        label: "Scope",
        options: [
          { value: "active", label: "Active only" },
          { value: "", label: "All reservations" },
        ],
      },
    ];
    if (isAdmin) {
      base.push({
        id: "provider",
        label: "Provider",
        options: [
          { value: "", label: "All providers" },
          ...providers.map((p) => ({
            value: String(p.id),
            label: p.businessName || p.displayName || `Provider ${p.id}`,
          })),
        ],
      });
    }
    return base;
  }, [isAdmin, providers]);

  return (
    <div>
      <PageHeader
        title="Reservations"
        description={
          isAdmin
            ? "Reservations across all chargers."
            : "Reservations across your chargers."
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row, i) => `${text(row.id)}-${i}`}
        manual
        loading={loading}
        filters={filters}
        filterValues={{ scope: scopeFilter, provider: providerFilter }}
        onFilterChange={(id, value) => {
          if (id === "scope") setScopeFilter(value);
          else if (id === "provider") setProviderFilter(value);
          setPage(0);
        }}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage={
          scopeFilter === "active"
            ? "No active reservations."
            : "No reservations."
        }
      />
    </div>
  );
}
