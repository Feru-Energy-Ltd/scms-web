"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Pagination from "@/components/account/Pagination";
import {
  fetchPricingAssignments,
  fetchPricingPlans,
  fetchPlatformConfig,
  assignPricingPlan,
  removeAssignment,
  type PricingAssignment,
  type PricingPlan,
  type PlatformConfigResponse,
} from "@/lib/api/pricing";
import { fetchActiveProviders, type ProviderListItem } from "@/lib/api/serviceProviders";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import toast from "react-hot-toast";
import AssignPlanModal from "./AssignPlanModal";
import styles from "./pricing.module.css";
import rlStyles from "@/components/account/ResourceList.module.css";

interface Props {
  preselectedOperatorId?: number | null;
}

export default function AssignmentsTab({ preselectedOperatorId }: Props) {
  const [assignments, setAssignments] = useState<PricingAssignment[]>([]);
  const [operators, setOperators] = useState<ProviderListItem[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [config, setConfig] = useState<PlatformConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignOperator, setAssignOperator] = useState<{ id: number; name: string; currentPlanId?: number } | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(operators.length / PAGE_SIZE);
  const pagedOperators = useMemo(
    () => operators.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [operators, page],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [a, o, p, c] = await Promise.all([
        fetchPricingAssignments(),
        fetchActiveProviders(),
        fetchPricingPlans(),
        fetchPlatformConfig(),
      ]);
      setAssignments(a);
      setOperators(o);
      setPlans(p);
      setConfig(c);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load assignment data." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Auto-open assign modal from approval flow
  useEffect(() => {
    if (preselectedOperatorId != null && operators.length > 0) {
      const op = operators.find((o) => o.id === preselectedOperatorId);
      if (op) {
        setAssignOperator({ id: op.id, name: op.businessName });
      }
    }
  }, [preselectedOperatorId, operators]);

  const handleAssign = async (pricingPlanId: number) => {
    if (!assignOperator) return;
    setSaving(true);
    try {
      await assignPricingPlan(assignOperator.id, pricingPlanId);
      toast.success("Plan assigned.");
      setAssignOperator(null);
      await loadData();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not assign plan." });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (confirmRemoveId == null) return;
    try {
      await removeAssignment(confirmRemoveId);
      toast.success("Assignment removed. Operator will use default plan.");
      setConfirmRemoveId(null);
      await loadData();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not remove assignment." });
    }
  };

  const assignmentMap = new Map(assignments.map((a) => [a.operatorId, a]));

  const defaultPlanName = config?.defaultPricingPlanId
    ? plans.find((p) => p.id === config.defaultPricingPlanId)?.name ?? "Unknown"
    : "Not set";

  if (loading) {
    return <p className={rlStyles.muted}>Loading…</p>;
  }

  return (
    <>
      <p className={rlStyles.muted} style={{ marginBottom: 16 }}>
        Default plan: <strong>{defaultPlanName}</strong> — used for operators without an explicit assignment.
      </p>

      <div className={rlStyles.tableWrap}>
        <table className={rlStyles.table}>
          <thead>
            <tr>
              <th className={rlStyles.th}>Operator</th>
              <th className={rlStyles.th}>Assigned Plan</th>
              <th className={rlStyles.th}>Assigned Date</th>
              <th className={rlStyles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedOperators.map((op) => {
              const assignment = assignmentMap.get(op.id);
              return (
                <tr key={op.id}>
                  <td className={rlStyles.td}>{op.businessName}</td>
                  <td className={rlStyles.td}>
                    {assignment ? (
                      assignment.pricingPlanName
                    ) : (
                      <span className={rlStyles.muted}>Using default: {defaultPlanName}</span>
                    )}
                  </td>
                  <td className={rlStyles.td}>
                    {assignment
                      ? new Date(assignment.assignedAt).toLocaleDateString()
                      : "\u2014"}
                  </td>
                  <td className={rlStyles.td}>
                    <div className={rlStyles.linkRow}>
                      <button
                        className={styles.actionBtn}
                        onClick={() =>
                          setAssignOperator({
                            id: op.id,
                            name: op.businessName,
                            currentPlanId: assignment?.pricingPlanId,
                          })
                        }
                      >
                        {assignment ? "Change" : "Assign"}
                      </button>
                      {assignment && (
                        <button
                          className={styles.deactivateBtn}
                          onClick={() => setConfirmRemoveId(op.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {assignOperator && (
        <AssignPlanModal
          operatorName={assignOperator.name}
          plans={plans}
          currentPlanId={assignOperator.currentPlanId}
          loading={saving}
          onSave={handleAssign}
          onCancel={() => setAssignOperator(null)}
        />
      )}

      {confirmRemoveId != null && (
        <div className={styles.overlay} onClick={() => setConfirmRemoveId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Remove Assignment</h2>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: "0 0 20px" }}>
              This operator will revert to the platform default plan ({defaultPlanName}). Continue?
            </p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setConfirmRemoveId(null)}>
                Cancel
              </button>
              <button
                className={styles.deactivateBtn}
                style={{ padding: "8px 18px", fontSize: "0.875rem", fontWeight: 600 }}
                onClick={() => void handleRemove()}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
