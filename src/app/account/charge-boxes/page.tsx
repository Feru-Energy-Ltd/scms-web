"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ChargerStatusModal, {
  type ChargerStatusModalTarget,
} from "@/components/account/ChargerStatusModal";
import DataTable, { type DataTableColumn } from "@/components/account/DataTable";
import DeleteResourceModal from "@/components/account/DeleteResourceModal";
import PageHeader from "@/components/account/PageHeader";
import RowActionsMenu from "@/components/account/RowActionsMenu";
import styles from "@/components/account/ResourceList.module.css";
import {
  deleteChargeBox,
  fetchChargeBoxes,
} from "@/lib/api/chargeBoxes";
import { asArray } from "@/lib/api/normalize";
import { setChargeBoxEnabled } from "@/lib/api/stations";
import { getStoredPermissions } from "@/lib/auth/session";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";

type ChargerRow = Record<string, unknown>;

type ChargerDeleteTarget = {
  id: string;
  station: string;
  address: string;
  onlineStatus: string;
  registration: string;
  enabled: boolean;
};

function cell(row: ChargerRow, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v != null && v !== "") return String(v);
  }
  return "—";
}

function rowEnabled(row: ChargerRow): boolean {
  const v = row.enabled;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toLowerCase() === "true" || v === "1";
  return true;
}

const PAGE_SIZE = 5;
const FETCH_SIZE = 500;

function isAccepted(reg: string): boolean {
  return reg.toLowerCase() === "accepted";
}

function isOnline(row: ChargerRow): boolean {
  const v = cell(row, "onlineStatus", "ON", "status");
  return v === "ON" || v === "true" || v === "1" || v === "connected";
}

export default function AccountChargeBoxesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stationIdParam = searchParams.get("stationId");
  const stationId = stationIdParam ? Number(stationIdParam) : undefined;
  const stationFilter =
    stationId != null && Number.isFinite(stationId) ? stationId : undefined;

  const [rows, setRows] = useState<ChargerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<ChargerDeleteTarget | null>(null);
  const [toggleTarget, setToggleTarget] =
    useState<ChargerStatusModalTarget | null>(null);

  const perms = useMemo(() => new Set(getStoredPermissions()), []);
  const canRead =
    perms.has("admin:chargers:read") || perms.has("provider:chargers:read");
  const canUpdate =
    perms.has("admin:chargers:update") || perms.has("provider:chargers:update");
  const canToggle = perms.has("admin:chargers:update");
  const canDelete = perms.has("admin:chargers:delete");
  const canReadTransactions =
    perms.has("admin:transactions:read") ||
    perms.has("provider:transactions:read");
  const canReadReservations =
    perms.has("admin:reservations:read") ||
    perms.has("provider:reservations:read");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await fetchChargeBoxes(0, FETCH_SIZE, {
        stationId: stationFilter,
      });
      setRows(asArray<ChargerRow>(raw));
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load charge boxes." });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [stationFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyToggle = async () => {
    if (!toggleTarget) return;
    setBusyId(toggleTarget.id);
    try {
      await setChargeBoxEnabled(toggleTarget.id, !toggleTarget.enabled);
      toast.success(
        toggleTarget.enabled ? "Charger disabled" : "Charger enabled",
      );
      setToggleTarget(null);
      await load();
    } catch (e) {
      showApiErrorToast(e, {
        fallbackMessage: "Could not change charger status.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const applyDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await deleteChargeBox(deleteTarget.id);
      toast.success("Charger deleted");
      setDeleteTarget(null);
      await load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not delete charger." });
    } finally {
      setBusyId(null);
    }
  };

  const columns = useMemo<DataTableColumn<ChargerRow>[]>(
    () => [
      {
        id: "chargeBoxId",
        header: "Charge box id",
        cell: (row) => cell(row, "chargeBoxId", "id"),
      },
      { id: "station", header: "Station", cell: (row) => cell(row, "stationId") },
      { id: "address", header: "Address", cell: (row) => cell(row, "address") },
      {
        id: "registration",
        header: "Registration",
        cell: (row) => {
          const reg = cell(row, "registrationStatus", "registration");
          return (
            <span className={isAccepted(reg) ? styles.badgeOk : styles.badgeNo}>
              {reg}
            </span>
          );
        },
      },
      {
        id: "online",
        header: "Online",
        cell: (row) => cell(row, "onlineStatus", "online", "status"),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (row, i) => {
          const id = cell(row, "chargeBoxId", "id", "chargerId") || String(i);
          const reg = cell(row, "registrationStatus", "registration");
          const enabled = rowEnabled(row);
          const busy = busyId === id;
          const viewHref = `/account/charge-boxes/${encodeURIComponent(id)}`;
          const editHref = `/account/charge-boxes/update/${encodeURIComponent(id)}`;
          return (
            <RowActionsMenu
              label={`Actions for ${id}`}
              items={[
                {
                  label: "View",
                  onClick: () => router.push(viewHref),
                  hidden: !canRead,
                },
                {
                  label: "Edit",
                  onClick: () => router.push(editHref),
                  hidden: !canUpdate,
                },
                {
                  label: "Transactions",
                  onClick: () => router.push(`${viewHref}?tab=transactions`),
                  hidden: !canReadTransactions,
                },
                {
                  label: "Bookings",
                  onClick: () => router.push(`${viewHref}?tab=bookings`),
                  hidden: !canReadReservations,
                },
                {
                  label: enabled ? "Disable" : "Enable",
                  onClick: () =>
                    setToggleTarget({
                      id,
                      enabled,
                      station: cell(row, "stationId"),
                      address: cell(row, "address"),
                      onlineStatus: cell(row, "onlineStatus", "online", "status"),
                      registration: reg,
                    }),
                  hidden: !canToggle,
                  disabled: busy,
                },
                {
                  label: "Delete",
                  onClick: () =>
                    setDeleteTarget({
                      id,
                      station: cell(row, "stationId"),
                      address: cell(row, "address"),
                      onlineStatus: cell(row, "onlineStatus", "online", "status"),
                      registration: reg,
                      enabled,
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
    [
      busyId,
      canDelete,
      canRead,
      canReadReservations,
      canReadTransactions,
      canToggle,
      canUpdate,
      router,
    ],
  );

  return (
    <div>
      <PageHeader
        title="Charge boxes"
        description="Chargers linked to your account."
        addHref="/account/charge-boxes/new"
        addLabel="New charger"
      />

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : rows.length === 0 ? (
        <p className={styles.muted}>No charge boxes.</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row, i) =>
            `${cell(row, "chargeBoxId", "id", "chargerId") || i}-${i}`
          }
          searchable
          searchPlaceholder="Search by charge box id, station, or address"
          searchAccessor={(row) =>
            `${cell(row, "chargeBoxId", "id")} ${cell(row, "stationId")} ${cell(row, "address")}`
          }
          filters={[
            {
              id: "registration",
              label: "Registration",
              options: [
                { value: "", label: "All registrations" },
                { value: "accepted", label: "Accepted" },
                { value: "other", label: "Not accepted" },
              ],
              predicate: (row, value) => {
                const reg = cell(row, "registrationStatus", "registration");
                return value === "accepted" ? isAccepted(reg) : !isAccepted(reg);
              },
            },
            {
              id: "online",
              label: "Online",
              options: [
                { value: "", label: "All connectivity" },
                { value: "ON", label: "Online" },
                { value: "OFF", label: "Offline" },
              ],
              predicate: (row, value) =>
                value === "ON" ? isOnline(row) : !isOnline(row),
            },
            {
              id: "status",
              label: "Status",
              options: [
                { value: "", label: "All statuses" },
                { value: "enabled", label: "Enabled" },
                { value: "disabled", label: "Disabled" },
              ],
              predicate: (row, value) =>
                value === "enabled" ? rowEnabled(row) : !rowEnabled(row),
            },
          ]}
          pageSize={PAGE_SIZE}
          emptyMessage="No charge boxes match your search."
        />
      )}

      {toggleTarget && (
        <ChargerStatusModal
          charger={toggleTarget}
          loading={busyId === toggleTarget.id}
          onConfirm={() => void applyToggle()}
          onCancel={() => setToggleTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteResourceModal
          eyebrow="Permanent removal"
          title="Delete charger"
          subtitle="This charger will be permanently removed from the system. This cannot be undone."
          resourceLabel="Charge box ID"
          resourceId={deleteTarget.id}
          statusBadge={
            deleteTarget.enabled ? "Currently enabled" : "Currently disabled"
          }
          fields={[
            { label: "Station", value: deleteTarget.station },
            { label: "Online", value: deleteTarget.onlineStatus },
            { label: "Registration", value: deleteTarget.registration },
            { label: "Address", value: deleteTarget.address, wide: true },
          ]}
          impactItems={[
            "The charger will no longer appear in lists or on the map.",
            "Drivers will not be able to start sessions on this charge box.",
            "Historical transaction and booking records are retained.",
          ]}
          acknowledgment="I understand this charger will be permanently deleted and cannot be recovered."
          confirmLabel="Delete charger"
          loading={busyId === deleteTarget.id}
          onConfirm={() => void applyDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
