"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import PricingPlansTab from "./PricingPlansTab";
import PlatformSettingsTab from "./PlatformSettingsTab";
import styles from "./pricing.module.css";
import rlStyles from "@/components/account/ResourceList.module.css";

type Tab = "plans" | "settings";

export default function PricingPage() {
  const [ctx] = useState(() => getAccessTokenContext());
  const searchParams = useSearchParams();
  const newPlanOperatorId = searchParams.get("newPlan");
  const [tab, setTab] = useState<Tab>("plans");

  if (ctx.identityType !== "SYSTEM_ADMIN") {
    return (
      <div>
        <h1 className={rlStyles.h1}>Pricing</h1>
        <p className={rlStyles.muted}>
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className={rlStyles.h1}>Pricing Configuration</h1>
      <p className={rlStyles.muted}>
        Manage pricing plans and platform-wide settings.
      </p>

      <div className={styles.tabs}>
        <button
          className={tab === "plans" ? styles.tabActive : styles.tab}
          onClick={() => setTab("plans")}
        >
          Pricing Plans
        </button>
        <button
          className={tab === "settings" ? styles.tabActive : styles.tab}
          onClick={() => setTab("settings")}
        >
          Platform Settings
        </button>
      </div>

      {tab === "plans" && (
        <PricingPlansTab
          preselectedOperatorId={
            newPlanOperatorId ? Number(newPlanOperatorId) : null
          }
        />
      )}
      {tab === "settings" && <PlatformSettingsTab />}
    </div>
  );
}
