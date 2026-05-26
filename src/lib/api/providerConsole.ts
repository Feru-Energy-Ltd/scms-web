import { csmsApiPath } from "../config";
import { apiRequestAuth } from "./http";
import type { ChargingStation } from "./stations";

export type ProviderStation = ChargingStation & {
  onlineCount: number;
  enabled: boolean;
};

export async function fetchProviderStations(
  providerId: number,
  opts: { enabled?: boolean; search?: string } = {},
): Promise<ProviderStation[]> {
  const q = new URLSearchParams({ providerId: String(providerId) });
  if (opts.enabled !== undefined) q.set("enabled", String(opts.enabled));
  if (opts.search) q.set("search", opts.search);
  const raw = await apiRequestAuth<unknown>(csmsApiPath(`/stations?${q}`));
  return Array.isArray(raw) ? (raw as ProviderStation[]) : [];
}

export async function setStationEnabled(stationId: number, enabled: boolean) {
  return apiRequestAuth<void>(csmsApiPath(`/stations/${stationId}/status`), {
    method: "PATCH",
    body: { enabled },
  });
}
