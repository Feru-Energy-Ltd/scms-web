"use client";

import { useCallback, useEffect, useState } from "react";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import { fetchOperatorDashboardStats, type OperatorDashboardStats } from "@/lib/api/dashboard";
import {
  fetchProviderTransactions,
  fetchSettlements,
  type ProviderTransaction,
  type SettlementHistory,
  type PageResponse,
} from "@/lib/api/billing";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";

type Tab = "transactions" | "settlements";

const STATUS_OPTIONS = ["", "ACTIVE", "IDLE", "ENERGY_SETTLED", "SETTLED"];
const SETTLEMENT_STATUS_OPTIONS = ["", "PENDING", "PROCESSING", "COMPLETED", "FAILED"];

export default function BillingPage() {
  const [ctx] = useState(() => getAccessTokenContext());
  const [tab, setTab] = useState<Tab>("transactions");

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
    if (ctx.providerId == null) return;
    setStLoading(true);
    try {
      const data = await fetchSettlements(
        ctx.providerId, stPage, 20,
        stStatus || undefined,
      );
      setStData(data);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load settlements." });
    } finally {
      setStLoading(false);
    }
  }, [ctx.providerId, stPage, stStatus]);

  useEffect(() => {
    if (tab === "settlements") void loadSettlements();
  }, [tab, loadSettlements]);

  /* ── Formatters ── */
  const fmtMoney = (n: number | undefined) =>
    n != null ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " RWF" : "—";

  const fmtKwh = (wh: number) => (wh / 1000).toFixed(2) + " kWh";

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString() : "—";

  const fmtDateTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString() : "—";

  return (
    <div>
      <h1 className={styles.h1}>Billing</h1>
      <p className={styles.muted}>Transaction history and settlement payouts.</p>

      {/* Balance summary */}
      {balance && (
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <div className={styles.card} style={{ flex: 1, minWidth: "180px", padding: "1rem" }}>
            <div className={styles.muted}>Earned Balance</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>{fmtMoney(balance.earnedBalance)}</div>
          </div>
          <div className={styles.card} style={{ flex: 1, minWidth: "180px", padding: "1rem" }}>
            <div className={styles.muted}>Pending Settlement</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>{fmtMoney(balance.pendingSettlement)}</div>
          </div>
          <div className={styles.card} style={{ flex: 1, minWidth: "180px", padding: "1rem" }}>
            <div className={styles.muted}>Total Settled</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>{fmtMoney(balance.totalSettled)}</div>
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
              className={styles.button}
              value={txCharger}
              onChange={(e) => { setTxCharger(e.target.value); setTxPage(0); }}
              style={{ minWidth: "120px" }}
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
                    <th>Charger</th>
                    <th>Energy</th>
                    <th>Energy Cost</th>
                    <th>Idle Cost</th>
                    <th>VAT</th>
                    <th>Total</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {txData.content.map((tx) => (
                    <tr key={tx.transactionId}>
                      <td>{tx.chargerId}/{tx.connectorId}</td>
                      <td>{fmtKwh(tx.energyConsumedWh)}</td>
                      <td>{fmtMoney(tx.energyCost)}</td>
                      <td>{fmtMoney(tx.idleCost)}</td>
                      <td>{fmtMoney(tx.vatAmount)}</td>
                      <td style={{ fontWeight: 600 }}>{fmtMoney(tx.totalDriverCost)}</td>
                      <td>{tx.durationMinutes} min</td>
                      <td>{tx.status}</td>
                      <td>{fmtDateTime(tx.createdAt)}</td>
                    </tr>
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
                    <th>Date</th>
                    <th>Amount</th>
                    <th>MoMo Reference</th>
                    <th>Status</th>
                    <th>Completed</th>
                    <th>Failure Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {stData.content.map((s) => (
                    <tr key={s.id}>
                      <td>{fmtDate(s.initiatedAt)}</td>
                      <td style={{ fontWeight: 600 }}>{fmtMoney(s.amount)}</td>
                      <td>{s.momoReferenceId ?? "—"}</td>
                      <td>{s.status}</td>
                      <td>{fmtDateTime(s.completedAt)}</td>
                      <td>{s.failureReason ?? "—"}</td>
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
