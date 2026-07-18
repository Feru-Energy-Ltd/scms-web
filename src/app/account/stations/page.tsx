"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import DataTable, { type DataTableColumn } from "@/components/account/DataTable";
import DeleteResourceModal from "@/components/account/DeleteResourceModal";
import PageHeader from "@/components/account/PageHeader";
import RowActionsMenu from "@/components/account/RowActionsMenu";
import StationStatusModal, {
  type StationStatusModalTarget,
} from "@/components/account/StationStatusModal";
import styles from "@/components/account/ResourceList.module.css";
import { fetchServiceProviders } from "@/lib/api/serviceProviders";
import {
  deleteStation,
  fetchStationsPage,
  setStationEnabled,
  type ChargingStation,
} from "@/lib/api/stations";
import { getStoredPermissions } from "@/lib/auth/session";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";

function providerLabel(
  providerId: number | null | undefined,
  names: Map<number, string>,
) {
  if (providerId == null) return "—";
  return names.get(providerId) ?? String(providerId);
}

type StationDeleteTarget = {
  id: number;
  stationId: string;
  enabled: boolean;
  address: string;
  provider: string;
  chargeBoxCount: number;
  onlineCount?: number;
};

const PAGE_SIZE = 5;

export default function ChargingStationsPage() {
  const router = useRouter();
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerNames, setProviderNames] = useState<Map<number, string>>(
    () => new Map(),
  );
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toggleTarget, setToggleTarget] =
    useState<StationStatusModalTarget | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<StationDeleteTarget | null>(null);

  // Server-side search / filter / pagination state.
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const perms = useMemo(() => new Set(getStoredPermissions()), []);
  const canRead =
    perms.has("admin:stations:read") ||
    perms.has("admin:chargers:read") ||
    perms.has("provider:chargers:read");
  const canToggle = perms.has("admin:stations:update");
  const canDelete =
    perms.has("admin:chargers:delete")

  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const enabled =
        statusFilter === "" ? undefined : statusFilter === "enabled";
      const res = await fetchStationsPage({
        page,
        size: PAGE_SIZE,
        search: search || undefined,
        enabled,
      });
      // Ignore responses superseded by a newer request.
      if (requestId !== requestIdRef.current) return;
      setStations(res.content ?? []);
      setTotalPages(res.totalPages ?? 0);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      showApiErrorToast(e, { fallbackMessage: "Could not load stations." });
      setStations([]);
      setTotalPages(0);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  // Debounce search input into the query that triggers a fetch.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetchServiceProviders({ page: 0, size: 500 });
        if (!alive) return;
        const map = new Map<number, string>();
        for (const p of res.content ?? []) {
          map.set(p.id, p.businessName || p.displayName);
        }
        setProviderNames(map);
      } catch {
        // Non-fatal: table falls back to provider id.
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const applyToggle = async () => {
    if (!toggleTarget) return;
    setBusyId(toggleTarget.id);
    try {
      await setStationEnabled(toggleTarget.id, !toggleTarget.enabled);
      toast.success(
        toggleTarget.enabled ? "Station disabled" : "Station enabled",
      );
      setToggleTarget(null);
      await load();
    } catch (e) {
      showApiErrorToast(e, {
        fallbackMessage: "Could not change station status.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const applyDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await deleteStation(deleteTarget.id);
      toast.success("Station deleted");
      setDeleteTarget(null);
      await load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not delete station." });
    } finally {
      setBusyId(null);
    }
  };

  const columns = useMemo<DataTableColumn<ChargingStation>[]>(
    () => [
      { id: "stationId", header: "Station id", cell: (s) => s.stationId },
      {
        id: "provider",
        header: "Provider",
        cell: (s) => providerLabel(s.providerId, providerNames),
      },
      {
        id: "address",
        header: "Address",
        cell: (s) => s.locationAddressName || "—",
      },
      {
        id: "chargers",
        header: "Chargers",
        cell: (s) =>
          s.chargeBoxCount > 0 ? (
            <Link href={`/account/charge-boxes?stationId=${s.id}`}>
              {s.chargeBoxCount}
            </Link>
          ) : (
            s.chargeBoxCount
          ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (s) => {
          const enabled = s.enabled !== false;
          const busy = busyId === s.id;
          const viewHref =
            s.providerId != null
              ? `/account/service-providers/${s.providerId}/stations/${s.id}`
              : null;
          return (
            <RowActionsMenu
              label={`Actions for ${s.stationId}`}
              items={[
                {
                  label: "View",
                  onClick: () => {
                    if (viewHref) router.push(viewHref);
                  },
                  hidden: !canRead || !viewHref,
                },
                {
                  label: enabled ? "Disable" : "Enable",
                  onClick: () =>
                    setToggleTarget({
                      id: s.id,
                      stationId: s.stationId,
                      enabled,
                      address: s.locationAddressName,
                      provider: providerLabel(s.providerId, providerNames),
                      chargeBoxCount: s.chargeBoxCount,
                      onlineCount: s.onlineCount,
                    }),
                  hidden: !canToggle,
                  disabled: busy,
                },
                {
                  label: "Delete",
                  onClick: () =>
                    setDeleteTarget({
                      id: s.id,
                      stationId: s.stationId,
                      enabled,
                      address: s.locationAddressName || "—",
                      provider: providerLabel(s.providerId, providerNames),
                      chargeBoxCount: s.chargeBoxCount,
                      onlineCount: s.onlineCount,
                    }),
                  destructive: true,
                  hidden: !canDelete,
                  disabled: busy,
                },
              ]}
            />
          );
        },
      },
    ],
    [busyId, canDelete, canRead, canToggle, providerNames, router],
  );

  return (
    <div>
      <PageHeader
        title="Charging stations"
        description="Physical sites that group one or more chargeboxes."
        addLabel="New station"
        addHref="/account/stations/new"
      />

      <DataTable
        columns={columns}
        rows={stations}
        getRowKey={(s) => s.id}
        manual
        loading={loading}
        searchable
        searchPlaceholder="Search by station id or address"
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        filters={[
          {
            id: "status",
            label: "Status",
            options: [
              { value: "", label: "All statuses" },
              { value: "enabled", label: "Enabled" },
              { value: "disabled", label: "Disabled" },
            ],
          },
        ]}
        filterValues={{ status: statusFilter }}
        onFilterChange={(_id, value) => {
          setStatusFilter(value);
          setPage(0);
        }}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage={
          search || statusFilter
            ? "No stations match your search."
            : "No charging stations yet. Create one above, or add a charger (a station is created automatically)."
        }
      />

      {toggleTarget && (
        <StationStatusModal
          station={toggleTarget}
          loading={busyId === toggleTarget.id}
          onConfirm={() => void applyToggle()}
          onCancel={() => setToggleTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteResourceModal
          eyebrow="Permanent removal"
          title="Delete station"
          subtitle="This station site will be permanently removed from the system. This cannot be undone."
          resourceLabel="Station ID"
          resourceId={deleteTarget.stationId}
          statusBadge={
            deleteTarget.enabled ? "Currently enabled" : "Currently disabled"
          }
          fields={[
            { label: "Provider", value: deleteTarget.provider },
            {
              label: "Chargers",
              value:
                deleteTarget.onlineCount != null
                  ? `${deleteTarget.chargeBoxCount} · ${deleteTarget.onlineCount} online`
                  : String(deleteTarget.chargeBoxCount),
            },
            { label: "Address", value: deleteTarget.address, wide: true },
          ]}
          impactItems={[
            "The station will no longer appear in lists or on the map.",
            "Drivers will not be able to discover this site.",
            "Chargers attached to this station must be deleted first.",
          ]}
          acknowledgment="I understand this station will be permanently deleted and cannot be recovered."
          confirmLabel="Delete station"
          blockReason={
            deleteTarget.chargeBoxCount > 0
              ? `This station still has ${deleteTarget.chargeBoxCount} charger(s). Delete those chargers first, then try again.`
              : null
          }
          loading={busyId === deleteTarget.id}
          onConfirm={() => void applyDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <p className={styles.muted} style={{ marginTop: 16 }}>
        Manage individual chargeboxes under{" "}
        <Link href="/account/charge-boxes">Charge Boxes</Link>.
      </p>
    </div>
  );
}
