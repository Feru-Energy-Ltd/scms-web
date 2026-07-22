"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import DataTable, { type DataTableColumn } from "@/components/account/DataTable";
import PageHeader from "@/components/account/PageHeader";
import RowActionsMenu from "@/components/account/RowActionsMenu";
import ConfirmModal from "@/components/account/ConfirmModal";
import styles from "@/components/account/ResourceList.module.css";
import {
  fetchChargingSessions,
  stopChargingSession,
  type ChargingSession,
  type ChargingSessionStatus,
} from "@/lib/api/sessions";
import { cellDateTime, cellText } from "@/lib/account/cellDisplay";
import { scopeAndProviderFilters } from "@/lib/account/providerDataTableFilter";
import { useAdminProviderFilter } from "@/lib/account/useAdminProviderFilter";
import { getStoredPermissions } from "@/lib/auth/session";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";

const PAGE_SIZE = 20;
const LIVE_STATUSES = new Set<string>(["ACTIVE", "IDLE"]);

const SESSION_SCOPE_OPTIONS = [
  { value: "active", label: "Active / idle" },
  { value: "all", label: "All (last 30 days)" },
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "IDLE", label: "IDLE" },
  { value: "ENERGY_SETTLED", label: "ENERGY SETTLED" },
  { value: "SETTLED", label: "SETTLED" },
];

const LAST_30_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Explicit window matching the “All (last 30 days)” / historical scopes. */
function last30DaysBounds(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - LAST_30_DAYS_MS);
  return { from: from.toISOString(), to: to.toISOString() };
}

function fmtEnergy(kwh: number | null | undefined): string {
  if (kwh == null) return "—";
  return `${Number(kwh).toFixed(3)} kWh`;
}

function fmtMoney(n: number | null | undefined): string {
  if (n == null) return "—";
  return (
    Number(n).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " RWF"
  );
}

function SessionStatusBadge({
  status,
}: Readonly<{ status: string }>) {
  if (LIVE_STATUSES.has(status)) {
    return <span className={styles.badgeOk}>{status}</span>;
  }
  if (status === "SETTLED" || status === "ENERGY_SETTLED") {
    return <span className={styles.badge}>{status.replaceAll("_", " ")}</span>;
  }
  return <span className={styles.badgeNo}>{status}</span>;
}

function SessionIdCell({
  transactionId,
}: Readonly<{ transactionId: number }>) {
  return <span className={styles.muted}>#{transactionId}</span>;
}

function SessionStopActions({
  session,
  acting,
  onStop,
}: Readonly<{
  session: ChargingSession;
  acting: boolean;
  onStop: (session: ChargingSession) => void;
}>) {
  return (
    <RowActionsMenu
      label={`Actions for session ${session.transactionId}`}
      items={[
        {
          label: "Stop session",
          onClick: () => onStop(session),
          hidden: !LIVE_STATUSES.has(session.status),
          destructive: true,
          disabled: acting,
        },
      ]}
    />
  );
}

function buildSessionColumns(opts: {
  canStop: boolean;
  acting: boolean;
  onRequestStop: (session: ChargingSession) => void;
}): DataTableColumn<ChargingSession>[] {
  const cols: DataTableColumn<ChargingSession>[] = [
    {
      id: "transaction",
      header: "Session",
      cell: (row) => <SessionIdCell transactionId={row.transactionId} />,
    },
    {
      id: "charger",
      header: "Charge box",
      cell: (row) => cellText(row.chargerId),
    },
    {
      id: "connector",
      header: "Connector",
      cell: (row) => cellText(row.connectorId),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <SessionStatusBadge status={cellText(row.status)} />,
    },
    {
      id: "energy",
      header: "Energy",
      cell: (row) => fmtEnergy(row.energyKwh),
    },
    {
      id: "cost",
      header: "Cost",
      cell: (row) => fmtMoney(row.totalDriverCost),
    },
    {
      id: "duration",
      header: "Duration",
      cell: (row) =>
        row.durationMinutes != null ? `${row.durationMinutes} min` : "—",
    },
    {
      id: "started",
      header: "Started",
      cell: (row) => cellDateTime(row.startedAt),
    },
    {
      id: "stopped",
      header: "Stopped",
      cell: (row) => cellDateTime(row.stoppedAt),
    },
  ];

  if (opts.canStop) {
    cols.push({
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <SessionStopActions
          session={row}
          acting={opts.acting}
          onStop={opts.onRequestStop}
        />
      ),
    });
  }

  return cols;
}

function resolveSessionStatusFilter(
  scopeFilter: string,
): ChargingSessionStatus | undefined {
  if (scopeFilter === "active" || scopeFilter === "all") return undefined;
  return scopeFilter as ChargingSessionStatus;
}

export default function AccountChargingSessionsPage() {
  const [rows, setRows] = useState<ChargingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState("active");
  const [acting, setActing] = useState(false);
  const [stopTarget, setStopTarget] = useState<ChargingSession | null>(null);

  const requestIdRef = useRef(0);
  const {
    isAdmin,
    providers,
    providerFilter,
    setProviderFilter,
    providerId,
  } = useAdminProviderFilter();

  const perms = useMemo(() => new Set(getStoredPermissions()), []);
  const canRead =
    perms.has("admin:sessions:read") || perms.has("provider:sessions:read");
  const canStop = perms.has("admin:sessions:update");

  const load = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const activeOnly = scopeFilter === "active";
      const res = await fetchChargingSessions({
        chargerId: appliedSearch || undefined,
        activeOnly,
        status: resolveSessionStatusFilter(scopeFilter),
        // Historical scopes: send the window explicitly so the list matches the UI label
        // (backend also defaults to 30 days, but the client should not rely on that alone).
        ...(activeOnly ? {} : last30DaysBounds()),
        providerId,
        page,
        size: PAGE_SIZE,
      });
      if (requestId !== requestIdRef.current) return;
      const pages = res.totalPages ?? 0;
      setTotalPages(pages);
      // After stop/filter, totalPages can shrink below the current index.
      // Clamp and bail so the next load (triggered by setPage) fills the table.
      if (pages > 0 && page >= pages) {
        setPage(pages - 1);
        return;
      }
      if (pages === 0 && page !== 0) {
        setPage(0);
        setRows([]);
        return;
      }
      setRows(res.content ?? []);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      showApiErrorToast(e, {
        fallbackMessage: "Could not load charging sessions.",
      });
      setRows([]);
      setTotalPages(0);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [canRead, appliedSearch, scopeFilter, providerId, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleStop(session: ChargingSession) {
    setActing(true);
    try {
      await stopChargingSession(session.id);
      toast.success("Stop requested for charging session.");
      setStopTarget(null);
      await load();
    } catch (e) {
      showApiErrorToast(e, {
        fallbackMessage: "Could not stop charging session.",
      });
    } finally {
      setActing(false);
    }
  }

  const columns = useMemo(
    () =>
      buildSessionColumns({
        canStop,
        acting,
        onRequestStop: setStopTarget,
      }),
    [canStop, acting],
  );

  const filters = useMemo(
    () => scopeAndProviderFilters(SESSION_SCOPE_OPTIONS, isAdmin, providers),
    [isAdmin, providers],
  );

  if (!canRead) {
    return (
      <div>
        <PageHeader
          title="Charging Sessions"
          description="Live and recent charging sessions."
        />
        <p className={styles.muted}>
          You do not have permission to view charging sessions.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Charging Sessions"
        description={
          isAdmin
            ? "Operational view of charging sessions across chargers."
            : "Operational view of charging sessions on your chargers."
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        manual
        loading={loading}
        searchable
        searchPlaceholder="Search charge box…"
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        filterValues={{ scope: scopeFilter, provider: providerFilter }}
        onFilterChange={(id, value) => {
          if (id === "scope") setScopeFilter(value);
          else if (id === "provider") setProviderFilter(value);
          setAppliedSearch(search.trim());
          setPage(0);
        }}
        page={page}
        totalPages={totalPages}
        onPageChange={(nextPage) => {
          // Keep the input aligned with the committed filter used by fetches.
          // Uncommitted typing must not stay visible while paging prior results.
          setSearch(appliedSearch);
          setPage(nextPage);
        }}
        emptyMessage={
          scopeFilter === "active"
            ? "No active or idle sessions."
            : "No charging sessions."
        }
        toolbarActions={
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              setAppliedSearch(search.trim());
              setPage(0);
            }}
          >
            Search
          </button>
        }
      />

      {stopTarget && (
        <ConfirmModal
          title="Stop charging session"
          message={`Send a remote stop to ${stopTarget.chargerId} (session #${stopTarget.transactionId})? Charging will end when the charger acknowledges.`}
          confirmLabel="Stop session"
          confirmDestructive
          loading={acting}
          onConfirm={() => void handleStop(stopTarget)}
          onCancel={() => setStopTarget(null)}
        />
      )}
    </div>
  );
}
