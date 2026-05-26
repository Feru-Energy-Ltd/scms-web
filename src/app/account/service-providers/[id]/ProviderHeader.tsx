"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import KpiCard from "@/components/account/KpiCard";
import ConfirmModal from "@/components/account/ConfirmModal";
import { SkeletonLine } from "@/components/account/Skeleton";
import {
  setServiceProviderStatus,
  uploadProviderLogo,
  type ProviderDetail,
} from "@/lib/api/serviceProviders";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import { getStoredPermissions } from "@/lib/auth/session";
import EditProviderDrawer from "./EditProviderDrawer";
import styles from "./provider.module.css";

const BADGE: Record<ProviderDetail["status"], string> = {
  ACTIVE: styles.badgeActive,
  SUSPENDED: styles.badgeSuspended,
  PENDING: styles.badgePending,
};

export default function ProviderHeader({
  provider,
  loading,
  stats,
  onRefresh,
}: {
  provider: ProviderDetail | null;
  loading: boolean;
  stats: { stations: number; chargers: number };
  onRefresh: (p: ProviderDetail) => void;
}) {
  const perms = getStoredPermissions();
  const canEdit = perms.includes("admin:providers:update");
  const canSuspend = perms.includes("admin:providers:suspend");
  const canActivate = perms.includes("admin:providers:activate");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  if (loading || !provider) {
    return (
      <div className={styles.header}>
        <div className={styles.logoBox} />
        <div className={styles.info}>
          <SkeletonLine width="200px" />
        </div>
      </div>
    );
  }

  const isActive = provider.status === "ACTIVE";
  const targetStatus = isActive ? "SUSPENDED" : "ACTIVE";
  const canToggle = isActive ? canSuspend : canActivate;

  const onLogoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const updated = await uploadProviderLogo(provider.id, file);
      toast.success("Logo updated");
      onRefresh(updated);
    } catch (err) {
      showApiErrorToast(err, { fallbackMessage: "Could not upload logo." });
    }
  };

  const applyStatus = async () => {
    setBusy(true);
    try {
      await setServiceProviderStatus(provider.id, targetStatus);
      toast.success(targetStatus === "ACTIVE" ? "Provider activated" : "Provider suspended");
      onRefresh({ ...provider, status: targetStatus });
      setConfirmOpen(false);
    } catch (err) {
      showApiErrorToast(err, { fallbackMessage: "Could not change status." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className={styles.header}>
        <div className={styles.logoBox}>
          {provider.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={provider.logoUrl} alt={`${provider.businessName} logo`} />
          ) : (
            <span className={styles.logoPlaceholder}>No logo</span>
          )}
          {canEdit && (
            <button
              type="button"
              className={styles.logoOverlay}
              onClick={() => fileInput.current?.click()}
            >
              Replace
            </button>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            hidden
            onChange={onLogoPick}
          />
        </div>

        <div className={styles.info}>
          <h1>{provider.businessName}</h1>
          <div className={styles.infoRow}>
            {provider.registration && <span>TIN: {provider.registration}</span>}
            {provider.email && <a href={`mailto:${provider.email}`}>{provider.email}</a>}
            {provider.phone && <a href={`tel:${provider.phone}`}>{provider.phone}</a>}
            {provider.website && (
              <a href={provider.website} target="_blank" rel="noreferrer">
                Website ↗
              </a>
            )}
          </div>
          <div className={styles.statusRow}>
            <span className={BADGE[provider.status]}>{provider.status}</span>
            {canToggle && (
              <button className={styles.actionBtn} onClick={() => setConfirmOpen(true)}>
                {isActive ? "Suspend" : "Activate"}
              </button>
            )}
            {canEdit && (
              <button className={styles.actionBtn} onClick={() => setDrawerOpen(true)}>
                Edit
              </button>
            )}
          </div>
        </div>

        <div className={styles.kpiRow}>
          <KpiCard label="Total Stations" value={stats.stations} />
          <KpiCard label="Total Chargers" value={stats.chargers} />
          <KpiCard label="Active Team Members" value={provider.activeTeamCount} />
          <KpiCard label="Status" value={provider.status} />
        </div>
      </div>

      {drawerOpen && (
        <EditProviderDrawer
          open={drawerOpen}
          provider={provider}
          onClose={() => setDrawerOpen(false)}
          onSaved={onRefresh}
        />
      )}

      {confirmOpen && (
        <ConfirmModal
          title={isActive ? "Suspend provider" : "Activate provider"}
          message={
            isActive
              ? "Suspending will disable the provider's access. Continue?"
              : "Activate this provider and restore access?"
          }
          confirmLabel={isActive ? "Suspend" : "Activate"}
          confirmDestructive={isActive}
          loading={busy}
          onConfirm={applyStatus}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
