"use client";

import { useEffect, useState } from "react";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import {
  fetchPricingAssignments,
  fetchPricingPlan,
  type PricingAssignment,
  type PricingPlan,
} from "@/lib/api/pricing";
import { parseApiUtcDateTime } from "@/lib/datetime/formatUtc";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import rlStyles from "@/components/account/ResourceList.module.css";
import styles from "./pricing.module.css";

function formatMoney(n: number) {
  return `RWF ${n.toFixed(2)}`;
}

export default function ProviderPricingView() {
  const [ctx] = useState(() => getAccessTokenContext());
  const [assignment, setAssignment] = useState<PricingAssignment | null>(null);
  const [plan, setPlan] = useState<PricingPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const providerId = ctx.providerId;
    if (providerId == null) {
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const assignments = await fetchPricingAssignments();
        if (!alive) return;
        const mine = assignments.find((a) => a.operatorId === providerId) ?? null;
        setAssignment(mine);
        if (mine) {
          const p = await fetchPricingPlan(mine.pricingPlanId);
          if (!alive) return;
          setPlan(p);
        }
      } catch (e) {
        showApiErrorToast(e, { fallbackMessage: "Could not load pricing." });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ctx.providerId]);

  if (loading) {
    return <p className={rlStyles.muted}>Loading…</p>;
  }

  if (ctx.providerId == null) {
    return (
      <p className={rlStyles.muted}>
        No provider context available for this account.
      </p>
    );
  }

  const assignedAt = assignment
    ? parseApiUtcDateTime(assignment.assignedAt)
    : null;

  return (
    <div>
      <h1 className={rlStyles.h1}>Pricing</h1>
      <p className={rlStyles.muted}>
        Rates are agreed between you and SafariCharge. They apply to
        all your stations. If you need to change the rates, please contact SafariCharge.
      </p>

      {plan ? (
        <div className={styles.configCard} style={{ maxWidth: 420, marginTop: 20 }}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>{plan.name}</span>
          </div>
          <div className={styles.cardRow}>
            Energy rate:{" "}
            <span className={styles.cardValue}>
              {formatMoney(plan.energyRatePerKwh)}/kWh
            </span>
          </div>
          <div className={styles.cardRow}>
            Idle fee:{" "}
            <span className={styles.cardValue}>
              {formatMoney(plan.idleFeePerMin)}/min
            </span>
          </div>
          <div className={styles.cardRow}>
            Idle grace:{" "}
            <span className={styles.cardValue}>{plan.idleGraceMinutes} min</span>
          </div>
          <div className={styles.cardRow}>
            Reservation fee:{" "}
            <span className={styles.cardValue}>
              {formatMoney(plan.reservationFee)}
            </span>
          </div>
          {assignedAt && (
            <div className={styles.cardRow}>
              Assigned:{" "}
              <span className={styles.cardValue}>
                {assignedAt.toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className={rlStyles.muted} style={{ marginTop: 20 }}>
          No pricing plan is assigned to your account yet. The platform default
          plan applies until one is assigned.
        </p>
      )}
    </div>
  );
}
