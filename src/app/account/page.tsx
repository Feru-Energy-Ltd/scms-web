"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  BatteryCharging,
  CalendarClock,
  Gauge,
  Hourglass,
  MapPin,
  Wallet,
  Wifi,
  Zap,
} from "lucide-react";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import {
  fetchOperatorDashboardStats,
  fetchProviderDashboardStats,
  type OperatorDashboardStats,
  type ProviderDashboardStats,
} from "@/lib/api/dashboard";
import KpiCard from "@/components/account/KpiCard";
import { getRoleLabel } from "@/lib/auth/roles"; 
import DashboardMapClient from "@/app/account/dashboard/DashboardMapClient";
import styles from "./page.module.css";

const POLL_INTERVAL_MS = 15_000;

export default function AccountDashboardPage() {
  const [ctx] = useState(() => getAccessTokenContext());

  const [providerStats, setProviderStats] = useState<ProviderDashboardStats | null>(null);
  const [operatorStats, setOperatorStats] = useState<OperatorDashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadStats() {
    try {
      const [csmsStats, paymentStats] = await Promise.all([
        fetchProviderDashboardStats().catch(() => null),
        ctx.providerId != null
          ? fetchOperatorDashboardStats(ctx.providerId).catch(() => null)
          : Promise.resolve(null),
      ]);

      if (csmsStats) setProviderStats(csmsStats);
      if (paymentStats) setOperatorStats(paymentStats);
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
    n != null ? `RWF ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>
            {`Viewing dashboard as  ${ctx.role ? getRoleLabel(ctx.role) : "your account"}`}
          </p>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.metrics}>
        <KpiCard
          icon={BatteryCharging}
          label="Total Chargers"
          value={fmt(providerStats?.totalChargers)}
          accent
        />
        <KpiCard
          icon={Wifi}
          label="Online / Offline"
          value={
            providerStats != null
              ? `${providerStats.onlineChargers} / ${providerStats.offlineChargers}`
              : "—"
          }
        />
        <KpiCard
          icon={Zap}
          label="Active Sessions"
          value={fmt(providerStats?.activeSessions)}
        />
        <KpiCard
          icon={Wallet}
          label="Earned Balance"
          value={fmtMoney(operatorStats?.earnedBalance)}
        />
        <KpiCard
          icon={Hourglass}
          label="Pending Settlement"
          value={fmtMoney(operatorStats?.pendingSettlement)}
        />
        <KpiCard
          icon={Activity}
          label="Sessions Today"
          value={fmt(providerStats?.totalSessionsToday)}
        />
        <KpiCard
          icon={Gauge}
          label="Energy Delivered"
          value={fmtKwh(providerStats?.energyDeliveredTodayKwh)}
          subtitle="Today"
        />
        <KpiCard
          icon={CalendarClock}
          label="Active Reservations"
          value={fmt(providerStats?.activeReservations)}
        />
      </div>

      <div className={styles.mapCard}>
        <div className={styles.cardTitle}>
          <MapPin size={16} className={styles.cardTitleIcon} />
          Station Map
        </div>
        <DashboardMapClient />
      </div>
    </div>
  );
}
