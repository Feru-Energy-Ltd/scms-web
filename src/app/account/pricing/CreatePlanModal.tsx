"use client";

import { useState } from "react";
import type { PricingPlan, CreatePricingPlanRequest } from "@/lib/api/pricing";
import type { ProviderListItem } from "@/lib/api/serviceProviders";
import styles from "./pricing.module.css";

interface Props {
  operators: ProviderListItem[];
  editPlan?: PricingPlan | null;
  preselectedOperatorId?: number | null;
  loading: boolean;
  onSave: (data: CreatePricingPlanRequest) => void;
  onCancel: () => void;
}

export default function CreatePlanModal({
  operators,
  editPlan,
  preselectedOperatorId,
  loading,
  onSave,
  onCancel,
}: Props) {
  const [name, setName] = useState(editPlan?.name ?? "");
  const [operatorId, setOperatorId] = useState<string>(
    editPlan?.operatorId != null
      ? String(editPlan.operatorId)
      : preselectedOperatorId != null
        ? String(preselectedOperatorId)
        : "",
  );
  const [energyRate, setEnergyRate] = useState(
    editPlan?.energyRatePerKwh != null ? String(editPlan.energyRatePerKwh) : "",
  );
  const [idleFee, setIdleFee] = useState(
    editPlan?.idleFeePerMin != null ? String(editPlan.idleFeePerMin) : "",
  );
  const [graceMinutes, setGraceMinutes] = useState(
    editPlan?.idleGraceMinutes != null ? String(editPlan.idleGraceMinutes) : "0",
  );
  const [reservationFee, setReservationFee] = useState(
    editPlan?.reservationFee != null ? String(editPlan.reservationFee) : "",
  );
  const [effectiveFrom, setEffectiveFrom] = useState(
    editPlan?.effectiveFrom ? editPlan.effectiveFrom.slice(0, 16) : "",
  );
  const [effectiveTo, setEffectiveTo] = useState(
    editPlan?.effectiveTo ? editPlan.effectiveTo.slice(0, 16) : "",
  );

  const handleSubmit = () => {
    const data: CreatePricingPlanRequest = {
      operatorId: operatorId ? Number(operatorId) : null,
      name: name.trim(),
      energyRatePerKwh: Number(energyRate),
      idleFeePerMin: Number(idleFee),
      idleGraceMinutes: Number(graceMinutes),
      reservationFee: Number(reservationFee),
      effectiveFrom: effectiveFrom,
      effectiveTo: effectiveTo || null,
    };
    onSave(data);
  };

  const valid =
    name.trim() &&
    energyRate &&
    Number(energyRate) >= 1 &&
    idleFee &&
    Number(idleFee) >= 0 &&
    reservationFee &&
    Number(reservationFee) >= 0 &&
    effectiveFrom;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>
          {editPlan ? "Edit Pricing Plan" : "Create Pricing Plan"}
        </h2>

        <div className={styles.formGrid}>
          <div className={`${styles.formField} ${styles.formGridFull}`}>
            <label className={styles.formLabel}>Plan Name *</label>
            <input
              className={styles.formInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Highway Fast Rate"
            />
          </div>

          <div className={`${styles.formField} ${styles.formGridFull}`}>
            <label className={styles.formLabel}>Operator</label>
            <select
              className={styles.formSelect}
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
            >
              <option value="">Platform Default (no operator)</option>
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.businessName}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Energy Rate (RWF/kWh) *</label>
            <input
              className={styles.formInput}
              type="number"
              min="1"
              step="0.01"
              value={energyRate}
              onChange={(e) => setEnergyRate(e.target.value)}
              placeholder="min 1.00"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Idle Fee (RWF/min) *</label>
            <input
              className={styles.formInput}
              type="number"
              min="0"
              step="0.01"
              value={idleFee}
              onChange={(e) => setIdleFee(e.target.value)}
              placeholder="min 0.00"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Idle Grace (minutes)</label>
            <input
              className={styles.formInput}
              type="number"
              min="0"
              value={graceMinutes}
              onChange={(e) => setGraceMinutes(e.target.value)}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Reservation Fee (RWF) *</label>
            <input
              className={styles.formInput}
              type="number"
              min="0"
              step="0.01"
              value={reservationFee}
              onChange={(e) => setReservationFee(e.target.value)}
              placeholder="min 0.00"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Effective From *</label>
            <input
              className={styles.formInput}
              type="datetime-local"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Effective To</label>
            <input
              className={styles.formInput}
              type="datetime-local"
              value={effectiveTo}
              onChange={(e) => setEffectiveTo(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.modalActions}>
          <button
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={styles.primaryBtn}
            onClick={handleSubmit}
            disabled={loading || !valid}
          >
            {loading
              ? "Saving…"
              : editPlan
                ? "Save Changes"
                : "Create as Draft"}
          </button>
        </div>
      </div>
    </div>
  );
}
