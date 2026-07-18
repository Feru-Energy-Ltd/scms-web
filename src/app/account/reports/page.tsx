"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import styles from "./reports.module.css";
import listStyles from "@/components/account/ResourceList.module.css";
import KpiCard from "@/components/account/KpiCard";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import {
  fetchProviderReportSummary,
  fetchRevenueTrend,
  fetchChargerBreakdown,
  fetchPlatformReportSummary,
  type ProviderReportSummary,
  type RevenueTrendPoint,
  type ChargerReportRow,
  type PlatformReportSummary,
} from "@/lib/api/reports";
import { fetchActiveProviders, type ProviderListItem } from "@/lib/api/serviceProviders";

const RevenueChart = dynamic(() => import("./RevenueChart"), { ssr: false });

const PAGE_SIZE = 10;

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmtMoney(v: number | null | undefined): string {
  if (v == null) return "RWF 0";
  return `RWF ${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtEnergy(wh: number): string {
  if (wh >= 1_000_000) return `${(wh / 1_000_000).toFixed(1)} MWh`;
  if (wh >= 1_000) return `${(wh / 1_000).toFixed(1)} kWh`;
  return `${wh} Wh`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ReportsPage() {
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(today());
  const [activePreset, setActivePreset] = useState<number | null>(30);
  const [providerId, setProviderId] = useState<number | undefined>();

  // Resolve admin status synchronously to avoid race with initial data load
  const initCtx = getAccessTokenContext();
  const isAdminUser = initCtx?.identityType === "SYSTEM_ADMIN";
  const [isAdmin] = useState(isAdminUser);
  const [showPlatform, setShowPlatform] = useState(isAdminUser);

  const [summary, setSummary] = useState<ProviderReportSummary | null>(null);
  const [trend, setTrend] = useState<RevenueTrendPoint[]>([]);
  const [chargers, setChargers] = useState<ChargerReportRow[]>([]);
  const [platform, setPlatform] = useState<PlatformReportSummary | null>(null);

  const [loadingSummary, setLoadingSummary] = useState(!isAdminUser);
  const [loadingTrend, setLoadingTrend] = useState(!isAdminUser);
  const [loadingChargers, setLoadingChargers] = useState(!isAdminUser);
  const [loadingPlatform, setLoadingPlatform] = useState(isAdminUser);
  const [expandedCharger, setExpandedCharger] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const [providers, setProviders] = useState<ProviderListItem[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchActiveProviders()
        .then(setProviders)
        .catch(() => {});
    }
  }, [isAdmin]);

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      setSummary(await fetchProviderReportSummary(from, to, providerId));
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Failed to load report summary" });
    } finally {
      setLoadingSummary(false);
    }
  }, [from, to, providerId]);

  const loadTrend = useCallback(async () => {
    setLoadingTrend(true);
    try {
      setTrend(await fetchRevenueTrend(from, to, providerId));
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Failed to load revenue trend" });
    } finally {
      setLoadingTrend(false);
    }
  }, [from, to, providerId]);

  const loadChargers = useCallback(async () => {
    setLoadingChargers(true);
    try {
      setChargers(await fetchChargerBreakdown(from, to, providerId));
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Failed to load charger breakdown" });
    } finally {
      setLoadingChargers(false);
    }
  }, [from, to, providerId]);

  const loadPlatform = useCallback(async () => {
    setLoadingPlatform(true);
    try {
      setPlatform(await fetchPlatformReportSummary(from, to));
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Failed to load platform summary" });
    } finally {
      setLoadingPlatform(false);
    }
  }, [from, to]);

  const loadAll = useCallback(() => {
    if (showPlatform) {
      loadPlatform();
    } else {
      loadSummary();
      loadTrend();
      loadChargers();
    }
  }, [showPlatform, loadPlatform, loadSummary, loadTrend, loadChargers]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function applyPreset(days: number) {
    setFrom(daysAgo(days));
    setTo(today());
    setActivePreset(days);
    setPage(0);
  }

  function handleProviderChange(value: string) {
    if (value === "platform" || value === "") {
      setShowPlatform(true);
      setProviderId(undefined);
    } else if (value === "all") {
      setShowPlatform(false);
      setProviderId(undefined);
    } else {
      setShowPlatform(false);
      setProviderId(Number(value));
    }
    setPage(0);
  }

  const totalPages = Math.ceil(chargers.length / PAGE_SIZE) || 1;
  const pagedChargers = chargers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <h1 className={listStyles.h1}>Reports</h1>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <input
          type="date"
          className={styles.dateInput}
          value={from}
          onChange={(e) => { setFrom(e.target.value); setActivePreset(null); }}
        />
        <span className={listStyles.muted}>to</span>
        <input
          type="date"
          className={styles.dateInput}
          value={to}
          onChange={(e) => { setTo(e.target.value); setActivePreset(null); }}
        />
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            className={activePreset === d ? styles.presetBtnActive : styles.presetBtn}
            onClick={() => applyPreset(d)}
          >
            {d}d
          </button>
        ))}
        <button className={styles.applyBtn} onClick={loadAll}>Apply</button>

        {isAdmin && (
          <select
            className={styles.providerSelect}
            value={showPlatform ? "platform" : (providerId != null ? String(providerId) : "all")}
            onChange={(e) => handleProviderChange(e.target.value)}
          >
            <option value="platform">Platform Overview</option>
            <option value="all">All providers</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.businessName || p.displayName}</option>
            ))}
          </select>
        )}
      </div>

      {/* Platform Summary (admin only) */}
      {showPlatform && (
        loadingPlatform ? (
          <div className={styles.spinner}>Loading platform summary…</div>
        ) : platform ? (
          <div className={styles.platformGrid}>
            <KpiCard label="Platform Revenue" value={fmtMoney(platform.totalPlatformRevenue)} />
            <KpiCard label="Operator Revenue" value={fmtMoney(platform.totalOperatorRevenue)} />
            <KpiCard label="Total Driver Spend" value={fmtMoney(platform.totalDriverSpend)} />
            <KpiCard label="Total Sessions" value={platform.totalSessions.toLocaleString()} />
            <KpiCard label="Energy Delivered" value={fmtEnergy(platform.totalEnergyWh)} />
            <KpiCard label="Active Providers" value={String(platform.activeProviderCount)} />
          </div>
        ) : (
          <div className={styles.empty}>No platform data available</div>
        )
      )}

      {/* Provider View */}
      {!showPlatform && (
        <>
          {/* KPI Cards */}
          {loadingSummary ? (
            <div className={styles.spinner}>Loading summary…</div>
          ) : summary ? (
            <div className={styles.kpiGrid}>
              {/* Revenue card with breakdown */}
              <div className={styles.revenueCard}>
                <div className={styles.revenueLabel}>Total Revenue</div>
                <div className={styles.revenueValue}>{fmtMoney(summary.totalRevenue)}</div>
                <div className={styles.revenueBreakdown}>
                  Energy: {fmtMoney(summary.energyRevenue)}<br />
                  Reservation: {fmtMoney(summary.reservationRevenue)}<br />
                  Idle: {fmtMoney(summary.idleRevenue)}<br />
                  Platform fees: {fmtMoney(summary.platformFees)}
                </div>
              </div>
              <KpiCard label="Sessions" value={summary.totalSessions.toLocaleString()} />
              <KpiCard label="Energy Delivered" value={fmtEnergy(summary.totalEnergyWh)} />
              <KpiCard
                label="Avg Revenue / Session"
                value={fmtMoney(summary.avgRevenuePerSession)}
                subtitle={`Avg duration: ${summary.avgSessionDurationMin} min`}
              />
            </div>
          ) : (
            <div className={styles.empty}>No summary data available</div>
          )}

          {/* Revenue Trend Chart */}
          <div className={styles.chartSection}>
            <div className={styles.chartTitle}>Revenue Trend</div>
            <div className={styles.chartWrap}>
              {loadingTrend ? (
                <div className={styles.spinner}>Loading chart…</div>
              ) : trend.length === 0 ? (
                <div className={styles.empty}>No data for selected period</div>
              ) : (
                <RevenueChart data={trend} />
              )}
            </div>
          </div>

          {/* Charger Breakdown Table */}
          <div className={styles.tableSection}>
            <div className={styles.sectionTitle}>Per-Charger Breakdown</div>
            {loadingChargers ? (
              <div className={styles.spinner}>Loading chargers…</div>
            ) : chargers.length === 0 ? (
              <div className={styles.empty}>No charger data for selected period</div>
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.th}>Charger</th>
                        <th className={styles.th}>Revenue</th>
                        <th className={styles.th}>Sessions</th>
                        <th className={styles.th}>Energy</th>
                        <th className={styles.th}>Avg Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedChargers.map((c) => (
                        <tr key={c.chargerId}>
                          <td colSpan={5} style={{ padding: 0 }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <tbody>
                                <tr
                                  className={styles.clickableRow}
                                  onClick={() =>
                                    setExpandedCharger(expandedCharger === c.chargerId ? null : c.chargerId)
                                  }
                                >
                                  <td className={styles.td}>
                                    <span
                                      className={`${styles.chevron} ${expandedCharger === c.chargerId ? styles.chevronOpen : ""}`}
                                    >
                                      ▶
                                    </span>
                                    {c.chargerName}
                                  </td>
                                  <td className={styles.td}>{fmtMoney(c.totalRevenue)}</td>
                                  <td className={styles.td}>{c.sessionCount}</td>
                                  <td className={styles.td}>{fmtEnergy(c.totalEnergyWh)}</td>
                                  <td className={styles.td}>{c.avgSessionDurationMin} min</td>
                                </tr>
                                {expandedCharger === c.chargerId && c.dailyBreakdown.length > 0 && (
                                  <tr className={styles.expandedRow}>
                                    <td colSpan={5}>
                                      <table className={styles.dailyTable}>
                                        <thead>
                                          <tr>
                                            <th>Date</th>
                                            <th>Revenue</th>
                                            <th>Sessions</th>
                                            <th>Energy</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {c.dailyBreakdown.map((d) => (
                                            <tr key={d.date}>
                                              <td>{fmtDate(d.date)}</td>
                                              <td>{fmtMoney(d.revenue)}</td>
                                              <td>{d.sessionCount}</td>
                                              <td>{fmtEnergy(d.energyWh)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={styles.pagination}>
                  <button className={styles.pageBtn} disabled={page === 0} onClick={() => setPage(page - 1)}>
                    Previous
                  </button>
                  <span>
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    className={styles.pageBtn}
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
