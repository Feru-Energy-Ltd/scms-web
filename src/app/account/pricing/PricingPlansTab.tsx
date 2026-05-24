"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchPricingPlans,
  createPricingPlan,
  activatePricingPlan,
  deactivatePricingPlan,
  type PricingPlan,
  type PricingPlanStatus,
  type CreatePricingPlanRequest,
} from "@/lib/api/pricing";
import { fetchActiveProviders, type ProviderListItem } from "@/lib/api/serviceProviders";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import toast from "react-hot-toast";
import CreatePlanModal from "./CreatePlanModal";
import styles from "./pricing.module.css";
import rlStyles from "@/components/account/ResourceList.module.css";

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Draft", value: "DRAFT" },
  { label: "Archived", value: "ARCHIVED" },
];

export default function PricingPlansTab() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [operators, setOperators] = useState<ProviderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState<PricingPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<number | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPricingPlans(
        undefined,
        statusFilter || undefined,
      );
      data.sort((a, b) => a.name.localeCompare(b.name));
      setPlans(data);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load pricing plans." });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadOperators = useCallback(async () => {
    try {
      setOperators(await fetchActiveProviders());
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    void loadOperators();
  }, [loadOperators]);



  const handleSave = async (data: CreatePricingPlanRequest) => {
    setSaving(true);
    try {
      await createPricingPlan(data);
      toast.success(editPlan ? "Plan updated." : "Plan created as Draft.");
      setShowModal(false);
      setEditPlan(null);
      await loadPlans();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not save pricing plan." });
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await activatePricingPlan(id);
      toast.success("Plan activated.");
      await loadPlans();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not activate plan." });
    }
  };

  const handleDeactivate = async () => {
    if (confirmDeactivateId == null) return;
    try {
      await deactivatePricingPlan(confirmDeactivateId);
      toast.success("Plan deactivated.");
      setConfirmDeactivateId(null);
      await loadPlans();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not deactivate plan." });
    }
  };

  const statusBadge = (status: PricingPlanStatus) => {
    const cls =
      status === "ACTIVE" ? styles.badgeActive
        : status === "DRAFT" ? styles.badgeDraft
          : styles.badgeArchived;
    return <span className={cls}>{status}</span>;
  };

  return (
    <>
      <div className={rlStyles.toolbar}>
        <div className={styles.filterPills}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              className={statusFilter === f.value ? styles.pillActive : styles.pill}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          className={rlStyles.buttonPrimary}
          onClick={() => { setEditPlan(null); setShowModal(true); }}
        >
          + New Plan
        </button>
      </div>

      {loading ? (
        <p className={rlStyles.muted}>Loading…</p>
      ) : plans.length === 0 ? (
        <p className={rlStyles.muted}>
          No pricing plans found.{" "}
          <button
            className={rlStyles.buttonPrimary}
            onClick={() => { setEditPlan(null); setShowModal(true); }}
          >
            Create your first plan
          </button>
        </p>
      ) : (
        <div className={rlStyles.tableWrap}>
          <table className={rlStyles.table}>
            <thead>
              <tr>
                <th className={rlStyles.th}>Name</th>
                <th className={rlStyles.th}>Energy Rate</th>
                <th className={rlStyles.th}>Idle Fee</th>
                <th className={rlStyles.th}>Grace</th>
                <th className={rlStyles.th}>Reservation</th>
                <th className={rlStyles.th}>Status</th>
                <th className={rlStyles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id}>
                  <td className={rlStyles.td}>{plan.name}</td>
                  <td className={rlStyles.td}>RWF {plan.energyRatePerKwh.toFixed(2)}/kWh</td>
                  <td className={rlStyles.td}>RWF {plan.idleFeePerMin.toFixed(2)}/min</td>
                  <td className={rlStyles.td}>{plan.idleGraceMinutes} min</td>
                  <td className={rlStyles.td}>RWF {plan.reservationFee.toFixed(2)}</td>
                  <td className={rlStyles.td}>{statusBadge(plan.status)}</td>
                  <td className={rlStyles.td}>
                    <div className={rlStyles.linkRow}>
                      {plan.status === "DRAFT" && (
                        <>
                          <button
                            className={styles.actionBtn}
                            onClick={() => { setEditPlan(plan); setShowModal(true); }}
                          >
                            Edit
                          </button>
                          <button
                            className={styles.activateBtn}
                            onClick={() => void handleActivate(plan.id)}
                          >
                            Activate
                          </button>
                        </>
                      )}
                      {plan.status === "ACTIVE" && (
                        <button
                          className={styles.deactivateBtn}
                          onClick={() => setConfirmDeactivateId(plan.id)}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <CreatePlanModal
          operators={operators}
          editPlan={editPlan}
          loading={saving}
          onSave={handleSave}
          onCancel={() => { setShowModal(false); setEditPlan(null); }}
        />
      )}

      {confirmDeactivateId != null && (
        <div className={styles.overlay} onClick={() => setConfirmDeactivateId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Deactivate Plan</h2>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: "0 0 20px" }}>
              This plan will be archived and can no longer be used for charging sessions. Are you sure?
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setConfirmDeactivateId(null)}
              >
                Cancel
              </button>
              <button
                className={styles.deactivateBtn}
                style={{ padding: "8px 18px", fontSize: "0.875rem", fontWeight: 600 }}
                onClick={() => void handleDeactivate()}
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
