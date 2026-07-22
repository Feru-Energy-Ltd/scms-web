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
} from "@/lib/api/sessions";
import {
  fetchActiveProviders,
  type ProviderListItem,
} from "@/lib/api/serviceProviders";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import { getStoredPermissions } from "@/lib/auth/session";
import { formatApiUtcDateTime } from "@/lib/datetime/formatUtc";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";

const PAGE_SIZE = 20;
const LIVE_STATUSES = new Set(["ACTIVE", "IDLE"]);

function text(value: unknown): string {
  if (value == null || value === "") return "—";
  return String(value);
}

function fmtDateTime(value: unknown): string {
  if (value == null || value === "") return "—";
  return formatApiUtcDateTime(String(value));
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

function StatusBadge({ status }: { status: string }) {
  if (LIVE_STATUSES.has(status)) {
    return <span className={styles.badgeOk}>{status}</span>;
  }
  if (status === "SETTLED" || status === "ENERGY_SETTLED") {
    return <span className={styles.badge}>{status.replaceAll("_", " ")}</span>;
  }
  return <span className={styles.badgeNo}>{status}</span>;
}

export default function AccountChargingSessionsPage() {
  const [rows, setRows] = useState<ChargingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState("active");
  const [providerFilter, setProviderFilter] = useState("");
  const [providers, setProviders] = useState<ProviderListItem[]>([]);
  const [acting, setActing] = useState(false);
  const [stopTarget, setStopTarget] = useState<ChargingSession | null>(null);

  const requestIdRef = useRef(0);

  const perms = useMemo(() => new Set(getStoredPermissions()), []);
  const isAdmin = useMemo(
    () => getAccessTokenContext()?.identityType === "SYSTEM_ADMIN",
    [],
  );
  const canRead =
    perms.has("admin:sessions:read") || perms.has("provider:sessions:read");
  const canStop = perms.has("admin:sessions:update");

  useEffect(() => {
    if (!isAdmin) return;
    fetchActiveProviders()
      .then(setProviders)
      .catch(() => {});
  }, [isAdmin]);

  const load = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const providerId =
        providerFilter === "" ? undefined : Number(providerFilter);
      const res = await fetchChargingSessions({
        chargerId: appliedSearch || undefined,
        activeOnly: scopeFilter === "active",
        status:
          scopeFilter === "active" || scopeFilter === "all"
            ? undefined
            : (scopeFilter as "ACTIVE" | "IDLE" | "ENERGY_SETTLED" | "SETTLED"),
        providerId,
        page,
        size: PAGE_SIZE,
      });
      if (requestId !== requestIdRef.current) return;
      setRows(res.content ?? []);
      setTotalPages(res.totalPages ?? 0);
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
  }, [canRead, appliedSearch, scopeFilter, providerFilter, page]);

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

  const columns = useMemo<DataTableColumn<ChargingSession>[]>(() => {
    const cols: DataTableColumn<ChargingSession>[] = [
      {
        id: "transaction",
        header: "Session",
        cell: (row) => (
          <span className={styles.muted}>#{row.transactionId}</span>
        ),
      },
      {
        id: "charger",
        header: "Charge box",
        cell: (row) => text(row.chargerId),
      },
      {
        id: "connector",
        header: "Connector",
        cell: (row) => text(row.connectorId),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={text(row.status)} />,
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
        cell: (row) => fmtDateTime(row.startedAt),
      },
      {
        id: "stopped",
        header: "Stopped",
        cell: (row) => fmtDateTime(row.stoppedAt),
      },
    ];

    if (canStop) {
      cols.push({
        id: "actions",
        header: "Actions",
        cell: (row) => (
          <RowActionsMenu
            label={`Actions for session ${row.transactionId}`}
            items={[
              {
                label: "Stop session",
                onClick: () => setStopTarget(row),
                hidden: !LIVE_STATUSES.has(row.status),
                destructive: true,
                disabled: acting,
              },
            ]}
          />
        ),
      });
    }

    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canStop, acting]);

  const filters = useMemo(() => {
    const base = [
      {
        id: "scope",
        label: "Scope",
        options: [
          { value: "active", label: "Active / idle" },
          { value: "all", label: "All (last 30 days)" },
          { value: "ACTIVE", label: "ACTIVE" },
          { value: "IDLE", label: "IDLE" },
          { value: "ENERGY_SETTLED", label: "ENERGY SETTLED" },
          { value: "SETTLED", label: "SETTLED" },
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
        onPageChange={setPage}
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
