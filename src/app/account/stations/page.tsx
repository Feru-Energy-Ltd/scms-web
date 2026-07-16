"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "@/components/account/PageHeader";
import Pagination from "@/components/account/Pagination";
import RowActionsMenu from "@/components/account/RowActionsMenu";
import StationStatusModal, {
  type StationStatusModalTarget,
} from "@/components/account/StationStatusModal";
import styles from "@/components/account/ResourceList.module.css";
import { fetchServiceProviders } from "@/lib/api/serviceProviders";
import {
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

export default function ChargingStationsPage() {
  const router = useRouter();
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [providerNames, setProviderNames] = useState<Map<number, string>>(
    () => new Map(),
  );
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toggleTarget, setToggleTarget] =
    useState<StationStatusModalTarget | null>(null);

  const perms = useMemo(() => new Set(getStoredPermissions()), []);
  const canRead =
    perms.has("admin:stations:read") ||
    perms.has("admin:chargers:read") ||
    perms.has("provider:chargers:read");
  const canToggle = perms.has("admin:stations:update");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchStationsPage(page, 5);
      setStations(res.content ?? []);
      setTotalPages(res.totalPages ?? 0);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load stations." });
      setStations([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

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

  return (
    <div>
      <PageHeader
        title="Charging stations"
        description="Physical sites that group one or more chargeboxes."
        addLabel="New station"
        addHref="/account/stations/new"
      />

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : stations.length === 0 ? (
        <p className={styles.muted}>
          No charging stations yet. Create one above, or add a charger (a station
          is created automatically).
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Station id</th>
                <th className={styles.th}>Provider</th>
                <th className={styles.th}>Address</th>
                <th className={styles.th}>Chargers</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((s) => {
                const enabled = s.enabled !== false;
                const busy = busyId === s.id;
                const viewHref =
                  s.providerId != null
                    ? `/account/service-providers/${s.providerId}/stations/${s.id}`
                    : null;

                return (
                  <tr key={s.id}>
                    <td className={styles.td}>{s.stationId}</td>
                    <td className={styles.td}>
                      {providerLabel(s.providerId, providerNames)}
                    </td>
                    <td className={styles.td}>
                      {s.locationAddressName || "—"}
                    </td>
                    <td className={styles.td}>
                      {s.chargeBoxCount > 0 ? (
                        <Link
                          href={`/account/charge-boxes?stationId=${s.id}`}
                        >
                          {s.chargeBoxCount}
                        </Link>
                      ) : (
                        s.chargeBoxCount
                      )}
                    </td>
                    <td className={styles.td}>
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
                                provider: providerLabel(
                                  s.providerId,
                                  providerNames,
                                ),
                                chargeBoxCount: s.chargeBoxCount,
                                onlineCount: s.onlineCount,
                              }),
                            hidden: !canToggle,
                            disabled: busy,
                            destructive: enabled,
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
        <StationStatusModal
          station={toggleTarget}
          loading={busyId === toggleTarget.id}
          onConfirm={() => void applyToggle()}
          onCancel={() => setToggleTarget(null)}
        />
      )}

      <p className={styles.muted} style={{ marginTop: 16 }}>
        Manage individual chargeboxes under{" "}
        <Link href="/account/charge-boxes">Charge Boxes</Link>.
      </p>
    </div>
  );
}
