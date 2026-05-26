"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import DataTable, { type DataTableColumn } from "@/components/account/DataTable";
import { SkeletonTable } from "@/components/account/Skeleton";
import ConfirmModal from "@/components/account/ConfirmModal";
import {
  fetchProviderStations,
  setStationEnabled,
  type ProviderStation,
} from "@/lib/api/providerConsole";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import { getStoredPermissions } from "@/lib/auth/session";
import styles from "./provider.module.css";

type StatusFilter = "all" | "active" | "disabled";

export default function StationsTab({ providerId }: { providerId: number }) {
  const router = useRouter();
  const [rows, setRows] = useState<ProviderStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [toggle, setToggle] = useState<ProviderStation | null>(null);
  const [busy, setBusy] = useState(false);

  const canManage = getStoredPermissions().includes("admin:stations:update");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const enabled = status === "all" ? undefined : status === "active";
      const data = await fetchProviderStations(providerId, {
        enabled,
        search: search.trim() || undefined,
      });
      setRows(data);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load stations." });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [providerId, status, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyToggle = async () => {
    if (!toggle) return;
    setBusy(true);
    try {
      await setStationEnabled(toggle.id, !toggle.enabled);
      toast.success(toggle.enabled ? "Station disabled" : "Station enabled");
      setToggle(null);
      void load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not change station status." });
    } finally {
      setBusy(false);
    }
  };

  const columns: DataTableColumn<ProviderStation>[] = [
    { id: "n", header: "#", cell: (_r, i) => i + 1 },
    { id: "name", header: "Station", cell: (r) => r.locationAddressName },
    { id: "chargers", header: "Total Chargers", cell: (r) => r.chargeBoxCount },
    { id: "online", header: "Online", cell: (r) => r.onlineCount },
    {
      id: "status",
      header: "Status",
      cell: (r) => (r.enabled ? "Active" : "Disabled"),
    },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <span className={styles.rowActions}>
          <button
            className={styles.actionBtn}
            onClick={() => router.push(`/account/service-providers/${providerId}/stations/${r.id}`)}
          >
            View
          </button>
          {canManage && (
            <button className={styles.actionBtn} onClick={() => setToggle(r)}>
              {r.enabled ? "Disable" : "Enable"}
            </button>
          )}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className={styles.toolbar}>
        <input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void load()}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
        <button className={styles.actionBtn} onClick={() => void load()}>
          Refresh
        </button>
      </div>

      {loading ? (
        <SkeletonTable cols={6} />
      ) : rows.length === 0 ? (
        <p>No stations registered yet.</p>
      ) : (
        <DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} />
      )}

      {toggle && (
        <ConfirmModal
          title={toggle.enabled ? "Disable station" : "Enable station"}
          message={`${toggle.enabled ? "Disable" : "Enable"} "${toggle.locationAddressName}"?`}
          confirmLabel={toggle.enabled ? "Disable" : "Enable"}
          confirmDestructive={toggle.enabled}
          loading={busy}
          onConfirm={applyToggle}
          onCancel={() => setToggle(null)}
        />
      )}
    </div>
  );
}
