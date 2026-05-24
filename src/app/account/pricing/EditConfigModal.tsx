"use client";

import { useState } from "react";
import type { PlatformConfigResponse, UpdatePlatformConfigRequest } from "@/lib/api/pricing";
import styles from "./pricing.module.css";

export type ConfigSection = "revenue" | "guardrails" | "wallet" | "session";

interface SectionDef {
  title: string;
  fields: { key: keyof UpdatePlatformConfigRequest; label: string; min: number; max?: number; step?: string }[];
}

const SECTIONS: Record<ConfigSection, SectionDef> = {
  revenue: {
    title: "Revenue Split",
    fields: [
      { key: "platformMarginPerKwh", label: "Platform Margin (RWF/kWh)", min: 0, step: "0.01" },
      { key: "reservationPlatformSharePct", label: "Reservation Platform Share (%)", min: 0, max: 100 },
      { key: "idlePlatformSharePct", label: "Idle Platform Share (%)", min: 0, max: 100 },
    ],
  },
  guardrails: {
    title: "Pricing Guardrails",
    fields: [
      { key: "minEnergyRate", label: "Min Energy Rate (RWF)", min: 1, step: "0.01" },
      { key: "maxEnergyRate", label: "Max Energy Rate (RWF)", min: 1, step: "0.01" },
      { key: "vatRatePct", label: "VAT Rate (%)", min: 0, max: 100 },
    ],
  },
  wallet: {
    title: "Wallet Limits",
    fields: [
      { key: "minTopup", label: "Min Top-up (RWF)", min: 0, step: "0.01" },
      { key: "maxWalletBalance", label: "Max Wallet Balance (RWF)", min: 0, step: "0.01" },
      { key: "lowBalanceThreshold", label: "Low Balance Threshold (RWF)", min: 0, step: "0.01" },
    ],
  },
  session: {
    title: "Session Rules",
    fields: [
      { key: "reservationWindowMinutes", label: "Reservation Window (minutes)", min: 1, max: 120 },
    ],
  },
};

interface Props {
  section: ConfigSection;
  config: PlatformConfigResponse;
  loading: boolean;
  onSave: (data: UpdatePlatformConfigRequest) => void;
  onCancel: () => void;
}

export default function EditConfigModal({
  section,
  config,
  loading,
  onSave,
  onCancel,
}: Props) {
  const def = SECTIONS[section];

  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of def.fields) {
      init[f.key] = String(config[f.key as keyof PlatformConfigResponse] ?? "");
    }
    return init;
  });

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    const data: UpdatePlatformConfigRequest = {};
    for (const f of def.fields) {
      const val = values[f.key];
      if (val !== "" && val !== String(config[f.key as keyof PlatformConfigResponse])) {
        (data as Record<string, number>)[f.key] = Number(val);
      }
    }
    onSave(data);
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Edit {def.title}</h2>

        <div className={styles.formGrid}>
          {def.fields.map((f) => (
            <div key={f.key} className={styles.formField}>
              <label className={styles.formLabel}>{f.label}</label>
              <input
                className={styles.formInput}
                type="number"
                min={f.min}
                max={f.max}
                step={f.step ?? "1"}
                value={values[f.key]}
                onChange={(e) => handleChange(f.key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className={styles.primaryBtn} onClick={handleSave} disabled={loading}>
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
