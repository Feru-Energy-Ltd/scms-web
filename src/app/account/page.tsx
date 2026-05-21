"use client";

import { useEffect, useState } from "react";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import {
  fetchOperatorDashboardStats,
  fetchProviderDashboardStats,
  type OperatorDashboardStats,
  type ProviderDashboardStats,
} from "@/lib/api/dashboard";
import KpiCard from "@/components/account/KpiCard";
import DashboardMapClient from "@/app/account/dashboard/DashboardMapClient";
import listStyles from "@/components/account/ResourceList.module.css";
import styles from "./page.module.css";

const POLL_INTERVAL_MS = 15_000;

export default function AccountDashboardPage() {
  const [ctx] = useState(() => getAccessTokenContext());

  const [providerStats, setProviderStats] = useState<ProviderDashboardStats | null>(null);
  const [operatorStats, setOperatorStats] = useState<OperatorDashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadStats() {
    try {
      const promises: [Promise<ProviderDashboardStats>, Promise<OperatorDashboardStats> | null] = [
        fetchProviderDashboardStats(),
        ctx.providerId != null ? fetchOperatorDashboardStats(ctx.providerId) : null,
      ];

      const [csmsStats, paymentStats] = await Promise.all(
        promises.map((p) => (p != null ? p.catch(() => null) : Promise.resolve(null)))
      );

      if (csmsStats) setProviderStats(csmsStats as ProviderDashboardStats);
      if (paymentStats) setOperatorStats(paymentStats as OperatorDashboardStats);
    } catch {
      setError("Failed to load dashboard stats.");
    }
  }

  useEffect(() => {
    loadStats();
    const timer = setInterval(loadStats, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmt = (n: number | undefined) =>
    n != null ? n.toLocaleString() : "—";

  const fmtKwh = (n: number | undefined) =>
    n != null ? `${n.toFixed(2)} kWh` : "—";

  const fmtMoney = (n: number | undefined) =>
    n != null ? `KES ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

  return (
    <div>
      <h1 className={listStyles.h1}>Dashboard</h1>
      <p className={listStyles.muted} style={{ marginBottom: "1.5rem" }}>
        {ctx.email ? ctx.email : ""}
        {ctx.identityType ? ` · ${ctx.identityType}` : ""}
      </p>

      {error && <p className={listStyles.error}>{error}</p>}

      {/* Row 1 */}
      <div className={styles.kpiGrid}>
        <KpiCard
          label="Total Chargers"
          value={fmt(providerStats?.totalChargers)}
        />
        <KpiCard
          label="Online / Offline"
          value={
            providerStats != null
              ? `${providerStats.onlineChargers} / ${providerStats.offlineChargers}`
              : "—"
          }
        />
        <KpiCard
          label="Active Sessions"
          value={fmt(providerStats?.activeSessions)}
        />
        <KpiCard
          label="Earned Balance"
          value={fmtMoney(operatorStats?.earnedBalance)}
        />
      </div>

      {/* Row 2 */}
      <div className={styles.kpiGrid}>
        <KpiCard
          label="Pending Settlement"
          value={fmtMoney(operatorStats?.pendingSettlement)}
        />
        <KpiCard
          label="Sessions Today"
          value={fmt(providerStats?.totalSessionsToday)}
        />
        <KpiCard
          label="Energy Delivered"
          value={fmtKwh(providerStats?.energyDeliveredTodayKwh)}
          subtitle="Today"
        />
        <KpiCard
          label="Active Reservations"
          value={fmt(providerStats?.activeReservations)}
        />
      </div>

      <div className={styles.mapSection}>
        <DashboardMapClient />
      </div>
    </div>
  );
}
