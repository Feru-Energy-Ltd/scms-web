"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import DataTable, { type DataTableColumn } from "@/components/account/DataTable";
import PageHeader from "@/components/account/PageHeader";
import RowActionsMenu from "@/components/account/RowActionsMenu";
import ConfirmModal from "@/components/account/ConfirmModal";
import styles from "@/components/account/ResourceList.module.css";
import {
  fetchVehicles,
  setVehicleActive,
  type Vehicle,
} from "@/lib/api/vehicles";
import { getStoredPermissions } from "@/lib/auth/session";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";

const PAGE_SIZE = 20;

function text(value: unknown): string {
  if (value == null || value === "") return "—";
  return String(value);
}

function connectorLabel(value: unknown): string {
  if (value == null || value === "") return "—";
  return String(value).replaceAll("_", " ");
}

export default function AccountVehiclesPage() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [acting, setActing] = useState(false);
  const [disableTarget, setDisableTarget] = useState<Vehicle | null>(null);

  const requestIdRef = useRef(0);

  const perms = useMemo(() => new Set(getStoredPermissions()), []);
  const canRead =
    perms.has("admin:vehicles:read") || perms.has("provider:vehicles:read");
  const canUpdate = perms.has("admin:vehicles:update");

  const load = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const active =
        activeFilter === "" ? undefined : activeFilter === "true";
      const res = await fetchVehicles({
        search: appliedSearch || undefined,
        active,
        page,
        size: PAGE_SIZE,
      });
      if (requestId !== requestIdRef.current) return;
      setRows(res.content ?? []);
      setTotalPages(res.totalPages ?? 0);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      showApiErrorToast(e, { fallbackMessage: "Could not load vehicles." });
      setRows([]);
      setTotalPages(0);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [canRead, appliedSearch, activeFilter, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSetActive(vehicle: Vehicle, active: boolean) {
    setActing(true);
    try {
      await setVehicleActive(vehicle.id, active);
      toast.success(active ? "Vehicle enabled." : "Vehicle disabled.");
      setDisableTarget(null);
      await load();
    } catch (e) {
      showApiErrorToast(e, {
        fallbackMessage: active
          ? "Could not enable vehicle."
          : "Could not disable vehicle.",
      });
    } finally {
      setActing(false);
    }
  }

  const columns = useMemo<DataTableColumn<Vehicle>[]>(() => {
    const cols: DataTableColumn<Vehicle>[] = [
      {
        id: "plate",
        header: "Plate",
        cell: (row) => text(row.plateNumber),
      },
      {
        id: "vehicle",
        header: "Vehicle",
        cell: (row) => {
          const parts = [row.brand, row.model, row.year].filter(Boolean);
          return parts.length ? parts.join(" ") : text(row.description);
        },
      },
      {
        id: "vin",
        header: "VIN",
        cell: (row) => text(row.vinNumber),
      },
      {
        id: "connector",
        header: "Connector",
        cell: (row) => connectorLabel(row.connectorType),
      },
      {
        id: "battery",
        header: "Battery (kWh)",
        cell: (row) =>
          row.batteryCapacity != null ? String(row.batteryCapacity) : "—",
      },
      {
        id: "owner",
        header: "Owner ID",
        cell: (row) => text(row.ownerId),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <span className={row.active ? styles.badgeOk : styles.badgeNo}>
            {row.active ? "Active" : "Disabled"}
          </span>
        ),
      },
    ];

    if (canUpdate) {
      cols.push({
        id: "actions",
        header: "Actions",
        cell: (row) => (
          <RowActionsMenu
            label={`Actions for ${row.plateNumber || row.id}`}
            items={[
              {
                label: "Enable",
                onClick: () => void handleSetActive(row, true),
                hidden: row.active,
                disabled: acting,
              },
              {
                label: "Disable",
                onClick: () => setDisableTarget(row),
                hidden: !row.active,
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
  }, [canUpdate, acting]);

  if (!canRead) {
    return (
      <div>
        <PageHeader title="Vehicles" description="Customer vehicles." />
        <p className={styles.muted}>
          You do not have permission to view vehicles.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Customer vehicles registered on the platform."
      />

      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        manual
        loading={loading}
        searchable
        searchPlaceholder="Search plate, VIN, brand…"
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            id: "active",
            label: "Status",
            options: [
              { value: "", label: "All statuses" },
              { value: "true", label: "Active" },
              { value: "false", label: "Disabled" },
            ],
          },
        ]}
        filterValues={{ active: activeFilter }}
        onFilterChange={(id, value) => {
          if (id === "active") setActiveFilter(value);
          setAppliedSearch(search.trim());
          setPage(0);
        }}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No vehicles."
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

      {disableTarget && (
        <ConfirmModal
          title="Disable vehicle"
          message={`Disable ${disableTarget.plateNumber}? The owner will not be able to use it for charging until re-enabled.`}
          confirmLabel="Disable"
          confirmDestructive
          loading={acting}
          onConfirm={() => void handleSetActive(disableTarget, false)}
          onCancel={() => setDisableTarget(null)}
        />
      )}
    </div>
  );
}
