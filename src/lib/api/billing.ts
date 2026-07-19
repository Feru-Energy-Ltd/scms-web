import { csmsApiPath, paymentApiPath } from "../config";
import { apiRequestAuth } from "./http";

/* ── Transactions (csms-service) ── */

export interface ProviderTransaction {
  transactionId: number;
  chargerId: string;
  connectorId: number;
  energyConsumedWh: number;
  energyCost: number;
  idleCost: number;
  platformMarginTotal: number;
  vatAmount: number;
  totalDriverCost: number;
  status: string;
  durationMinutes: number;
  createdAt: string;
  lastUpdatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export async function fetchProviderTransactions(
  page = 0,
  size = 20,
  from?: string,
  to?: string,
  status?: string,
  chargerId?: string,
): Promise<PageResponse<ProviderTransaction>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  if (status) q.set("status", status);
  if (chargerId) q.set("chargerId", chargerId);
  return apiRequestAuth<PageResponse<ProviderTransaction>>(
    csmsApiPath(`/providers/transactions?${q.toString()}`),
  );
}

/* ── Settlements (payment-service) ── */

export interface SettlementHistory {
  id: number;
  operatorId: number;
  amount: number;
  status: string;
  momoReferenceId: string | null;
  momoTransactionId: string | null;
  failureReason: string | null;
  initiatedAt: string;
  completedAt: string | null;
}

function buildSettlementQuery(
  page: number,
  size: number,
  status?: string,
  from?: string,
  to?: string,
): URLSearchParams {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) q.set("status", status);
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  return q;
}

export async function fetchSettlements(
  operatorId: number,
  page = 0,
  size = 20,
  status?: string,
  from?: string,
  to?: string,
): Promise<PageResponse<SettlementHistory>> {
  const q = buildSettlementQuery(page, size, status, from, to);
  return apiRequestAuth<PageResponse<SettlementHistory>>(
    paymentApiPath(`/operators/${operatorId}/settlements?${q.toString()}`),
  );
}

export async function fetchAggregateSettlements(
  page = 0,
  size = 20,
  status?: string,
  from?: string,
  to?: string,
): Promise<PageResponse<SettlementHistory>> {
  const q = buildSettlementQuery(page, size, status, from, to);
  return apiRequestAuth<PageResponse<SettlementHistory>>(
    paymentApiPath(`/operators/settlements?${q.toString()}`),
  );
}
