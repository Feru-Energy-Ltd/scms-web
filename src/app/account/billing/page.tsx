"use client";

import { useCallback, useEffect, useState } from "react";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import { fetchOperatorDashboardStats, type OperatorDashboardStats } from "@/lib/api/dashboard";
import {
  fetchProviderTransactions,
  fetchSettlements,
  fetchAggregateSettlements,
  type ProviderTransaction,
  type SettlementHistory,
  type PageResponse,
} from "@/lib/api/billing";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";
import billingStyles from "./billing.module.css";

type Tab = "transactions" | "settlements";

const STATUS_OPTIONS = ["", "ACTIVE", "IDLE", "ENERGY_SETTLED", "SETTLED"];
const SETTLEMENT_STATUS_OPTIONS = ["", "PENDING", "PROCESSING", "COMPLETED", "FAILED"];

export default function BillingPage() {
  const [ctx] = useState(() => getAccessTokenContext());
  const [tab, setTab] = useState<Tab>("transactions");
  const [expandedTx, setExpandedTx] = useState<number | null>(null);

  /* ── Balance summary ── */
  const [balance, setBalance] = useState<OperatorDashboardStats | null>(null);

  useEffect(() => {
    if (ctx.providerId == null) return;
    fetchOperatorDashboardStats(ctx.providerId).then((d) => setBalance(d ?? null)).catch(() => {});
  }, [ctx.providerId]);

  /* ── Transactions tab state ── */
  const [txPage, setTxPage] = useState(0);
  const [txData, setTxData] = useState<PageResponse<ProviderTransaction> | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [txStatus, setTxStatus] = useState("");
  const [txCharger, setTxCharger] = useState("");

  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const data = await fetchProviderTransactions(
        txPage, 20, undefined, undefined,
        txStatus || undefined,
        txCharger || undefined,
      );
      setTxData(data);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load transactions." });
    } finally {
      setTxLoading(false);
    }
  }, [txPage, txStatus, txCharger]);

  useEffect(() => {
    if (tab === "transactions") void loadTransactions();
  }, [tab, loadTransactions]);

  /* ── Settlements tab state ── */
  const [stPage, setStPage] = useState(0);
  const [stData, setStData] = useState<PageResponse<SettlementHistory> | null>(null);
  const [stLoading, setStLoading] = useState(false);
  const [stStatus, setStStatus] = useState("");

  const loadSettlements = useCallback(async () => {
    if (ctx.providerId == null && ctx.identityType !== "SYSTEM_ADMIN") return;
    setStLoading(true);
    try {
      const data = ctx.providerId != null
        ? await fetchSettlements(ctx.providerId, stPage, 20, stStatus || undefined)
        : await fetchAggregateSettlements(stPage, 20, stStatus || undefined);
      setStData(data);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load settlements." });
    } finally {
      setStLoading(false);
    }
  }, [ctx.providerId, ctx.identityType, stPage, stStatus]);

  useEffect(() => {
    if (tab === "settlements") void loadSettlements();
  }, [tab, loadSettlements]);

  /* ── Formatters ── */
  const fmtMoney = (n: number | undefined) =>
    n != null ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " RWF" : "—";

  const fmtKwh = (wh: number) => (wh / 1000).toFixed(3) + " kWh";

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const fmtTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "";

  const truncateCharger = (id: string) => {
    if (id.length <= 12) return id;
    return id.slice(0, 6) + "..." + id.slice(-4);
  };

  const statusDot = (status: string) => {
    const color = ["SETTLED", "COMPLETED", "SUCCESSFUL"].includes(status)
      ? "#10b981"
      : ["FAILED"].includes(status)
        ? "#ef4444"
        : ["ACTIVE"].includes(status)
          ? "#3b82f6"
          : "#f59e0b";
    return color;
  };

  const statusPill = (status: string) => {
    const color = statusDot(status);
    const label = status === "ENERGY_SETTLED" ? "Energy Settled" : status.charAt(0) + status.slice(1).toLowerCase();
    return (
      <span className={billingStyles.statusPill}>
        <span className={billingStyles.statusDot} style={{ background: color }} />
        {label}
      </span>
    );
  };

  const toggleExpand = (txId: number) => {
    setExpandedTx(expandedTx === txId ? null : txId);
  };

  return (
    <div>
      <h1 className={styles.h1}>Billing</h1>
      <p className={styles.muted}>Transaction history and settlement payouts.</p>

      {/* Balance summary */}
      {balance && (
        <div className={billingStyles.balanceGrid}>
          <div className={billingStyles.balanceCard}>
            <div className={billingStyles.balanceLabel}>Earned Balance</div>
            <div className={billingStyles.balanceValue}>{fmtMoney(balance.earnedBalance)}</div>
          </div>
          <div className={billingStyles.balanceCard}>
            <div className={billingStyles.balanceLabel}>Pending Settlement</div>
            <div className={billingStyles.balanceValueWarn}>{fmtMoney(balance.pendingSettlement)}</div>
          </div>
          <div className={billingStyles.balanceCard}>
            <div className={billingStyles.balanceLabel}>Total Settled</div>
            <div className={billingStyles.balanceValue}>{fmtMoney(balance.totalSettled)}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.toolbar}>
        <button
          type="button"
          className={tab === "transactions" ? styles.buttonPrimary : styles.button}
          onClick={() => setTab("transactions")}
        >
          Transactions
        </button>
        <button
          type="button"
          className={tab === "settlements" ? styles.buttonPrimary : styles.button}
          onClick={() => setTab("settlements")}
        >
          Settlements
        </button>
      </div>

      {/* ── Transactions Tab ── */}
      {tab === "transactions" && (
        <>
          <div className={styles.toolbar}>
            <select
              className={styles.button}
              value={txStatus}
              onChange={(e) => { setTxStatus(e.target.value); setTxPage(0); }}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.filter(Boolean).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Charger ID"
              className={styles.searchInput}
              value={txCharger}
              onChange={(e) => { setTxCharger(e.target.value); setTxPage(0); }}
              style={{ minWidth: "140px" }}
            />
            <button type="button" className={styles.button} onClick={() => void loadTransactions()}>
              Refresh
            </button>
            <button
              type="button" className={styles.button}
              disabled={txPage <= 0}
              onClick={() => setTxPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <button
              type="button" className={styles.button}
              disabled={txData != null && txPage >= txData.totalPages - 1}
              onClick={() => setTxPage((p) => p + 1)}
            >
              Next
            </button>
            <span className={styles.muted}>
              Page {txPage + 1}{txData ? ` of ${txData.totalPages}` : ""}
            </span>
          </div>

          {txLoading ? (
            <p className={styles.muted}>Loading...</p>
          ) : !txData || txData.content.length === 0 ? (
            <p className={styles.muted}>No transactions found.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>#</th>
                    <th className={styles.th}>Charger</th>
                    <th className={styles.th}>Date</th>
                    <th className={styles.th}>Energy</th>
                    <th className={styles.th} style={{ textAlign: "right" }}>Energy Cost</th>
                    <th className={styles.th} style={{ textAlign: "right" }}>Idle Fee</th>
                    <th className={styles.th} style={{ textAlign: "right" }}>VAT (incl.)</th>
                    <th className={styles.th} style={{ textAlign: "right" }}>Total</th>
                    <th className={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {txData.content.map((tx) => (
                    <>
                      <tr
                        key={tx.transactionId}
                        className={billingStyles.clickableRow}
                        onClick={() => toggleExpand(tx.transactionId)}
                      >
                        <td className={styles.td}>
                          <span className={billingStyles.txId}>#TX-{tx.transactionId}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={billingStyles.chargerBadge}>
                            <span className={billingStyles.chargerDot} />
                            {truncateCharger(tx.chargerId)} - {tx.connectorId}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <div>{fmtDate(tx.createdAt)}</div>
                          <div className={styles.muted} style={{ fontSize: "0.8rem" }}>{fmtTime(tx.createdAt)}</div>
                        </td>
                        <td className={styles.td}>
                          <div>{fmtKwh(tx.energyConsumedWh)}</div>
                          <div className={styles.muted} style={{ fontSize: "0.8rem" }}>{tx.durationMinutes} min</div>
                        </td>
                        <td className={styles.td} style={{ textAlign: "right" }}>
                          {fmtMoney(tx.energyCost)}
                        </td>
                        <td className={styles.td} style={{ textAlign: "right" }}>
                          {tx.idleCost > 0 ? (
                            <span className={billingStyles.idleHighlight}>{fmtMoney(tx.idleCost)}</span>
                          ) : (
                            <span className={styles.muted}>—</span>
                          )}
                        </td>
                        <td className={styles.td} style={{ textAlign: "right" }}>
                          {fmtMoney(tx.vatAmount)}
                        </td>
                        <td className={styles.td} style={{ textAlign: "right", fontWeight: 700, fontSize: "1rem" }}>
                          {fmtMoney(tx.totalDriverCost)}
                        </td>
                        <td className={styles.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {statusPill(tx.status)}
                            <span className={`${billingStyles.chevron} ${expandedTx === tx.transactionId ? billingStyles.chevronOpen : ""}`}>&#9662;</span>
                          </div>
                        </td>
                      </tr>
                      {expandedTx === tx.transactionId && (
                        <tr key={`${tx.transactionId}-detail`} className={billingStyles.expandedRow}>
                          <td className={styles.td} colSpan={9}>
                            <div className={billingStyles.detailGrid}>
                              <div className={billingStyles.detailSection}>
                                <div className={billingStyles.detailTitle}>Cost Breakdown — #TX-{tx.transactionId}</div>
                                <div className={billingStyles.breakdownGrid}>
                                  <div>
                                    <div className={billingStyles.breakdownLabel}>Energy Cost</div>
                                    <div className={billingStyles.breakdownValue}>{fmtMoney(tx.energyCost)}</div>
                                  </div>
                                  <div>
                                    <div className={billingStyles.breakdownLabel}>Idle Fee</div>
                                    <div className={billingStyles.breakdownValue}>{fmtMoney(tx.idleCost)}</div>
                                  </div>
                                  <div>
                                    <div className={billingStyles.breakdownLabel}>Platform Fee</div>
                                    <div className={billingStyles.breakdownValue}>{fmtMoney(tx.platformMarginTotal)}</div>
                                  </div>
                                  <div>
                                    <div className={billingStyles.breakdownLabel}>VAT (incl.)</div>
                                    <div className={billingStyles.breakdownValue}>{fmtMoney(tx.vatAmount)}</div>
                                  </div>
                                  <div>
                                    <div className={billingStyles.breakdownLabel} style={{ color: "#10b981" }}>Driver Total</div>
                                    <div className={billingStyles.breakdownValue} style={{ color: "#10b981", fontWeight: 700, fontSize: "1.1rem" }}>
                                      {fmtMoney(tx.totalDriverCost)}
                                    </div>
                                  </div>
                                </div>
                                {tx.idleCost > 0 && (
                                  <div className={billingStyles.idleBanner}>
                                    Idle fee charged — vehicle was not moved after charge complete
                                  </div>
                                )}
                              </div>
                              <div className={billingStyles.detailMeta}>
                                <div>Transaction #TX-{tx.transactionId}</div>
                                <div>Connector {tx.connectorId}</div>
                                <div>{fmtKwh(tx.energyConsumedWh)} &middot; {tx.durationMinutes} min</div>
                                <div>{fmtDate(tx.createdAt)} at {fmtTime(tx.createdAt)}</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Settlements Tab ── */}
      {tab === "settlements" && (
        <>
          <div className={styles.toolbar}>
            <select
              className={styles.button}
              value={stStatus}
              onChange={(e) => { setStStatus(e.target.value); setStPage(0); }}
            >
              <option value="">All statuses</option>
              {SETTLEMENT_STATUS_OPTIONS.filter(Boolean).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button type="button" className={styles.button} onClick={() => void loadSettlements()}>
              Refresh
            </button>
            <button
              type="button" className={styles.button}
              disabled={stPage <= 0}
              onClick={() => setStPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <button
              type="button" className={styles.button}
              disabled={stData != null && stPage >= stData.totalPages - 1}
              onClick={() => setStPage((p) => p + 1)}
            >
              Next
            </button>
            <span className={styles.muted}>
              Page {stPage + 1}{stData ? ` of ${stData.totalPages}` : ""}
            </span>
          </div>

          {stLoading ? (
            <p className={styles.muted}>Loading...</p>
          ) : !stData || stData.content.length === 0 ? (
            <p className={styles.muted}>No settlements found.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Date</th>
                    <th className={styles.th} style={{ textAlign: "right" }}>Amount</th>
                    <th className={styles.th}>MoMo Reference</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Completed</th>
                    <th className={styles.th}>Failure Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {stData.content.map((s) => (
                    <tr key={s.id}>
                      <td className={styles.td}>
                        <div>{fmtDate(s.initiatedAt)}</div>
                        <div className={styles.muted} style={{ fontSize: "0.8rem" }}>{fmtTime(s.initiatedAt)}</div>
                      </td>
                      <td className={styles.td} style={{ textAlign: "right", fontWeight: 700, fontSize: "1rem" }}>
                        {fmtMoney(s.amount)}
                      </td>
                      <td className={styles.td}>
                        <code className={billingStyles.monoRef}>{s.momoReferenceId ?? "—"}</code>
                      </td>
                      <td className={styles.td}>{statusPill(s.status)}</td>
                      <td className={styles.td}>
                        {s.completedAt ? (
                          <>
                            <div>{fmtDate(s.completedAt)}</div>
                            <div className={styles.muted} style={{ fontSize: "0.8rem" }}>{fmtTime(s.completedAt)}</div>
                          </>
                        ) : (
                          <span className={styles.muted}>—</span>
                        )}
                      </td>
                      <td className={`${styles.td} ${styles.muted}`}>{s.failureReason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
