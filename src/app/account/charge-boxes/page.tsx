"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ChargerStatusModal, {
  type ChargerStatusModalTarget,
} from "@/components/account/ChargerStatusModal";
import DeleteResourceModal from "@/components/account/DeleteResourceModal";
import PageHeader from "@/components/account/PageHeader";
import Pagination from "@/components/account/Pagination";
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

export default function AccountChargeBoxesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stationIdParam = searchParams.get("stationId");
  const stationId = stationIdParam ? Number(stationIdParam) : undefined;
  const stationFilter =
    stationId != null && Number.isFinite(stationId) ? stationId : undefined;

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
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

  useEffect(() => {
    setPage(0);
  }, [stationFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = (await fetchChargeBoxes(page, 5, {
        stationId: stationFilter,
      })) as { totalPages?: number };
      setRows(asArray<ChargerRow>(raw));
      setTotalPages(raw?.totalPages ?? 0);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load charge boxes." });
      setRows([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, stationFilter]);

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
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Charge box id</th>
                <th className={styles.th}>Station</th>
                <th className={styles.th}>Address</th>
                <th className={styles.th}>Registration</th>
                <th className={styles.th}>Online</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const id =
                  cell(row, "chargeBoxId", "id", "chargerId") || String(i);
                const reg = cell(row, "registrationStatus", "registration");
                const accepted =
                  reg.toLowerCase() === "accepted" || reg === "ACCEPTED";
                const enabled = rowEnabled(row);
                const busy = busyId === id;
                const viewHref = `/account/charge-boxes/${encodeURIComponent(id)}`;
                const editHref = `/account/charge-boxes/update/${encodeURIComponent(id)}`;

                return (
                  <tr key={`${id}-${i}`}>
                    <td className={styles.td}>
                      {cell(row, "chargeBoxId", "id")}
                    </td>
                    <td className={styles.td}>{cell(row, "stationId")}</td>
                    <td className={styles.td}>{cell(row, "address")}</td>
                    <td className={styles.td}>
                      <span
                        className={accepted ? styles.badgeOk : styles.badgeNo}
                      >
                        {reg}
                      </span>
                    </td>
                    <td className={styles.td}>
                      {cell(row, "onlineStatus", "online", "status")}
                    </td>
                    <td className={styles.td}>
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
                            onClick: () =>
                              router.push(`${viewHref}?tab=transactions`),
                            hidden: !canReadTransactions,
                          },
                          {
                            label: "Bookings",
                            onClick: () =>
                              router.push(`${viewHref}?tab=bookings`),
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
                                onlineStatus: cell(
                                  row,
                                  "onlineStatus",
                                  "online",
                                  "status",
                                ),
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
                                onlineStatus: cell(
                                  row,
                                  "onlineStatus",
                                  "online",
                                  "status",
                                ),
                                registration: reg,
                                enabled,
                              }),
                            destructive: true,
                            hidden: !canDelete,
                            disabled: busy,
                          },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
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
