"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchPlatformConfig,
  updatePlatformConfig,
  type PlatformConfigResponse,
  type UpdatePlatformConfigRequest,
} from "@/lib/api/pricing";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import toast from "react-hot-toast";
import EditConfigModal, { type ConfigSection } from "./EditConfigModal";
import styles from "./pricing.module.css";

export default function PlatformSettingsTab() {
  const [config, setConfig] = useState<PlatformConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editSection, setEditSection] = useState<ConfigSection | null>(null);
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      setConfig(await fetchPlatformConfig());
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load platform config." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const handleSave = async (data: UpdatePlatformConfigRequest) => {
    setSaving(true);
    try {
      const updated = await updatePlatformConfig(data);
      setConfig(updated);
      toast.success("Platform settings updated.");
      setEditSection(null);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not update settings." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ color: "var(--color-text-muted)" }}>Loading…</p>;
  }

  if (!config) {
    return <p style={{ color: "#b91c1c" }}>Failed to load platform configuration.</p>;
  }

  return (
    <>
      <div className={styles.cardGrid}>
        {/* Revenue Split */}
        <div className={styles.configCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Revenue Split</span>
            <button className={styles.cardEditBtn} onClick={() => setEditSection("revenue")}>
              Edit
            </button>
          </div>
          <div className={styles.cardRow}>
            Platform margin: <span className={styles.cardValue}>RWF {config.platformMarginPerKwh.toFixed(2)}/kWh</span>
          </div>
          <div className={styles.cardRow}>
            Reservation share: <span className={styles.cardValue}>{config.reservationPlatformSharePct}%</span>
          </div>
          <div className={styles.cardRow}>
            Idle share: <span className={styles.cardValue}>{config.idlePlatformSharePct}%</span>
          </div>
        </div>

        {/* Pricing Guardrails */}
        <div className={styles.configCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Pricing Guardrails</span>
            <button className={styles.cardEditBtn} onClick={() => setEditSection("guardrails")}>
              Edit
            </button>
          </div>
          <div className={styles.cardRow}>
            Energy rate: <span className={styles.cardValue}>RWF {config.minEnergyRate.toFixed(2)} – {config.maxEnergyRate.toFixed(2)}</span>
          </div>
          <div className={styles.cardRow}>
            VAT: <span className={styles.cardValue}>{config.vatRatePct}%</span>
          </div>
        </div>

        {/* Wallet Limits */}
        <div className={styles.configCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Wallet Limits</span>
            <button className={styles.cardEditBtn} onClick={() => setEditSection("wallet")}>
              Edit
            </button>
          </div>
          <div className={styles.cardRow}>
            Min top-up: <span className={styles.cardValue}>RWF {config.minTopup.toFixed(2)}</span>
          </div>
          <div className={styles.cardRow}>
            Max balance: <span className={styles.cardValue}>RWF {config.maxWalletBalance.toFixed(2)}</span>
          </div>
          <div className={styles.cardRow}>
            Low balance alert: <span className={styles.cardValue}>RWF {config.lowBalanceThreshold.toFixed(2)}</span>
          </div>
        </div>

        {/* Session Rules */}
        <div className={styles.configCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Session Rules</span>
            <button className={styles.cardEditBtn} onClick={() => setEditSection("session")}>
              Edit
            </button>
          </div>
          <div className={styles.cardRow}>
            Reservation window: <span className={styles.cardValue}>{config.reservationWindowMinutes} min</span>
          </div>
        </div>
      </div>

      {editSection && (
        <EditConfigModal
          section={editSection}
          config={config}
          loading={saving}
          onSave={handleSave}
          onCancel={() => setEditSection(null)}
        />
      )}
    </>
  );
}
