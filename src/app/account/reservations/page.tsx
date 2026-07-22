"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DataTable, { type DataTableColumn } from "@/components/account/DataTable";
import PageHeader from "@/components/account/PageHeader";
import styles from "@/components/account/ResourceList.module.css";
import { fetchReservations, type ReservationSummary } from "@/lib/api/chargeBoxes";
import { asArray } from "@/lib/api/normalize";
import { cellDateTime, cellText } from "@/lib/account/cellDisplay";
import { scopeAndProviderFilters } from "@/lib/account/providerDataTableFilter";
import { useAdminProviderFilter } from "@/lib/account/useAdminProviderFilter";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";

type ReservationRow = Partial<ReservationSummary> & Record<string, unknown>;

const PAGE_SIZE = 10;

/** Statuses the backend treats as "active" (Accepted / Occupied / Pending). */
const ACTIVE_STATUSES = new Set(["Accepted", "Occupied", "Pending"]);
const SUCCESS_STATUSES = new Set(["Completed"]);
const FAILED_STATUSES = new Set([
  "Cancelled",
  "Expired",
  "Faulted",
  "Unavailable",
  "Deleted",
]);

const RESERVATION_SCOPE_OPTIONS = [
  { value: "active", label: "Active only" },
  { value: "", label: "All reservations" },
];

function ReservationStatusBadge({
  status,
}: Readonly<{ status: string }>) {
  if (ACTIVE_STATUSES.has(status) || SUCCESS_STATUSES.has(status)) {
    return <span className={styles.badgeOk}>{status}</span>;
  }
  if (FAILED_STATUSES.has(status)) {
    return <span className={styles.badgeNo}>{status}</span>;
  }
  return <span className={styles.badge}>{status}</span>;
}

const RESERVATION_COLUMNS: DataTableColumn<ReservationRow>[] = [
  {
    id: "chargeBoxId",
    header: "Charge box",
    cell: (row) => cellText(row.chargeBoxId),
  },
  {
    id: "connectorId",
    header: "Connector",
    cell: (row) => cellText(row.connectorId),
  },
  {
    id: "plateNumber",
    header: "Plate number",
    cell: (row) => cellText(row.plateNumber),
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => (
      <ReservationStatusBadge status={cellText(row.status)} />
    ),
  },
  {
    id: "scheduledStart",
    header: "Start",
    cell: (row) => cellDateTime(row.scheduledStart),
  },
  {
    id: "scheduledEnd",
    header: "Expiry",
    cell: (row) => cellDateTime(row.scheduledEnd),
  },
  {
    id: "locationAddress",
    header: "Location",
    cell: (row) => cellText(row.locationAddress),
  },
];

export default function AccountReservationsPage() {
  const [rows, setRows] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [scopeFilter, setScopeFilter] = useState("active");

  const requestIdRef = useRef(0);
  const {
    isAdmin,
    providers,
    providerFilter,
    setProviderFilter,
    providerId,
  } = useAdminProviderFilter();

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
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
  }, [page, scopeFilter, providerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filters = useMemo(
    () =>
      scopeAndProviderFilters(
        RESERVATION_SCOPE_OPTIONS,
        isAdmin,
        providers,
      ),
    [isAdmin, providers],
  );

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
        columns={RESERVATION_COLUMNS}
        rows={rows}
        getRowKey={(row, i) => `${cellText(row.id)}-${i}`}
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
