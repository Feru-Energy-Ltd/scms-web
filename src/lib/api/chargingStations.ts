import { apiRequestAuth } from "./http";

export async function fetchChargingStations(page = 0, size = 20) {
  const q = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return apiRequestAuth<unknown>(`/charging-stations?${q.toString()}`);
}

export async function fetchChargingStationById(chargerId: string) {
  return apiRequestAuth<unknown>(`/charging-stations/view/${chargerId}`);
}
