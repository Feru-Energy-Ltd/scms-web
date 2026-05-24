"use client";

import { useState } from "react";
import type { PricingPlan } from "@/lib/api/pricing";
import styles from "./pricing.module.css";

interface Props {
  operatorName: string;
  plans: PricingPlan[];
  currentPlanId?: number | null;
  loading: boolean;
  onSave: (pricingPlanId: number) => void;
  onCancel: () => void;
}

export default function AssignPlanModal({
  operatorName,
  plans,
  currentPlanId,
  loading,
  onSave,
  onCancel,
}: Props) {
  const activePlans = plans.filter((p) => p.status === "ACTIVE");
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    currentPlanId != null ? String(currentPlanId) : "",
  );

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>
          {currentPlanId ? "Change Pricing Plan" : "Assign Pricing Plan"}
        </h2>

        <div className={styles.formGrid}>
          <div className={`${styles.formField} ${styles.formGridFull}`}>
            <label className={styles.formLabel}>Operator</label>
            <input
              className={styles.formInput}
              value={operatorName}
              disabled
            />
          </div>

          <div className={`${styles.formField} ${styles.formGridFull}`}>
            <label className={styles.formLabel}>Pricing Plan *</label>
            <select
              className={styles.formSelect}
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
            >
              <option value="">Select a plan…</option>
              {activePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — RWF {p.energyRatePerKwh.toFixed(2)}/kWh
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className={styles.primaryBtn}
            onClick={() => onSave(Number(selectedPlanId))}
            disabled={loading || !selectedPlanId}
          >
            {loading ? "Saving…" : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}
