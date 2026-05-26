"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SkeletonLine } from "@/components/account/Skeleton";
import { fetchPricingAssignments, type PricingAssignment } from "@/lib/api/pricing";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import { getStoredPermissions } from "@/lib/auth/session";
import styles from "./provider.module.css";

export default function PricingTab({ providerId }: { providerId: number }) {
  const router = useRouter();
  const [assignment, setAssignment] = useState<PricingAssignment | null>(null);
  const [loading, setLoading] = useState(true);

  const canManage = getStoredPermissions().includes("admin:pricing:update");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const all = await fetchPricingAssignments();
        if (!alive) return;
        setAssignment(all.find((a) => a.operatorId === providerId) ?? null);
      } catch (e) {
        showApiErrorToast(e, { fallbackMessage: "Could not load pricing." });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [providerId]);

  if (loading) return <SkeletonLine width="260px" />;

  return (
    <div>
      {assignment ? (
        <div className={styles.info}>
          <h1 style={{ fontSize: "1.1rem" }}>{assignment.pricingPlanName}</h1>
          {(() => {
            const d = assignment.assignedAt ? new Date(assignment.assignedAt) : null;
            const valid = d && !Number.isNaN(d.getTime());
            return valid ? (
              <p className={styles.infoRow}>Assigned {d.toLocaleDateString()}</p>
            ) : null;
          })()}
        </div>
      ) : (
        <p>No pricing plan assigned (platform default applies).</p>
      )}
      {canManage && (
        <button className={styles.actionBtn} onClick={() => router.push("/account/pricing")}>
          Change Plan
        </button>
      )}
    </div>
  );
}
