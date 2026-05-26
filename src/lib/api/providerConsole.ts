import { csmsApiPath } from "../config";
import { apiRequestAuth, type Page } from "./http";
import type { ChargingStation } from "./stations";

export type ProviderStation = ChargingStation & {
  onlineCount: number;
  enabled: boolean;
};

export async function fetchProviderStations(
  providerId: number,
  opts: { enabled?: boolean; search?: string; page?: number; size?: number } = {},
): Promise<Page<ProviderStation>> {
  const q = new URLSearchParams({
    providerId: String(providerId),
    page: String(opts.page ?? 0),
    size: String(opts.size ?? 20),
  });
  if (opts.enabled !== undefined) q.set("enabled", String(opts.enabled));
  if (opts.search) q.set("search", opts.search);
  return apiRequestAuth<Page<ProviderStation>>(csmsApiPath(`/stations?${q}`));
}

export async function setStationEnabled(stationId: number, enabled: boolean) {
  return apiRequestAuth<void>(csmsApiPath(`/stations/${stationId}/status`), {
    method: "PATCH",
    body: { enabled },
  });
}
