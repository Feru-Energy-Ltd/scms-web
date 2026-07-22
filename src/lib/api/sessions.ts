import { csmsApiPath } from "../config";
import { apiRequestAuth, type Page } from "./http";

export type ChargingSessionStatus =
  | "ACTIVE"
  | "IDLE"
  | "ENERGY_SETTLED"
  | "SETTLED";

export type ChargingSession = {
  id: number;
  transactionId: number;
  chargerId: string;
  connectorId: number;
  operatorId: number | null;
  energyKwh: number | null;
  totalDriverCost: number | null;
  status: ChargingSessionStatus;
  durationMinutes: number;
  startedAt: string;
  stoppedAt: string | null;
};

export type FetchSessionsOptions = {
  chargerId?: string;
  status?: ChargingSessionStatus;
  activeOnly?: boolean;
  from?: string;
  to?: string;
  providerId?: number;
  page?: number;
  size?: number;
};

export async function fetchChargingSessions(
  opts: FetchSessionsOptions = {},
): Promise<Page<ChargingSession>> {
  const {
    chargerId,
    status,
    activeOnly = false,
    from,
    to,
    providerId,
    page = 0,
    size = 20,
  } = opts;
  const q = new URLSearchParams({
    page: String(page),
    size: String(size),
    activeOnly: String(activeOnly),
  });
  if (chargerId?.trim()) q.set("chargerId", chargerId.trim());
  if (status) q.set("status", status);
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  if (providerId != null) q.set("providerId", String(providerId));
  return apiRequestAuth<Page<ChargingSession>>(csmsApiPath(`/sessions?${q}`));
}

export async function stopChargingSession(sessionId: number): Promise<void> {
  await apiRequestAuth<unknown>(csmsApiPath(`/sessions/${sessionId}/stop`), {
    method: "POST",
  });
}
