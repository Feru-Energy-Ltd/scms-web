import { csmsApiPath } from "../config";
import { ApiError, apiRequestAuth, type Page } from "./http";

export type ChargingStation = {
  id: number;
  stationId: string;
  providerId?: number | null;
  locationLatitude?: string;
  locationLongitude?: string;
  locationAddressName: string;
  imageUrl?: string;
  chargeBoxCount: number;
  onlineCount?: number;
  enabled?: boolean;
};

export type CreateChargingStationPayload = {
  providerId?: number;
  locationLatitude?: string;
  locationLongitude?: string;
  locationAddressName: string;
  adminAddress?: string;
  imageBase64?: string;
};

export type StationGeoLocation = {
  stationId: string;
  latitude: string;
  longitude: string;
  address: string;
  chargerCount: number;
};

/** Paged station list. `GET /stations` now returns a Spring `Page`. */
export async function fetchStationsPage(
  page = 0,
  size = 20,
): Promise<Page<ChargingStation>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  return apiRequestAuth<Page<ChargingStation>>(csmsApiPath(`/stations?${q}`), {
    method: "GET",
  });
}

/** Convenience: fetch all stations (single large page) for dropdowns / aggregate counts. */
export async function fetchStations(size = 500): Promise<ChargingStation[]> {
  const res = await fetchStationsPage(0, size);
  return res.content ?? [];
}

export async function createStation(payload: CreateChargingStationPayload) {
  return apiRequestAuth<ChargingStation>(csmsApiPath("/stations"), {
    method: "POST",
    body: payload,
  });
}

export type ChargeBoxSummary = {
  id: number;
  chargeBoxId: string;
  currentType: string | null;
  onlineStatus: string | null;
  enabled: boolean;
  createdAt: string | null;
};

export type StationDetail = {
  id: number;
  stationId: string;
  providerId: number | null;
  locationLatitude?: string;
  locationLongitude?: string;
  locationAddressName: string;
  imageUrl?: string;
  enabled: boolean;
  chargeBoxCount: number;
  onlineCount: number;
  chargeBoxes: ChargeBoxSummary[];
};

export async function fetchStationDetail(id: number): Promise<StationDetail> {
  return apiRequestAuth<StationDetail>(csmsApiPath(`/stations/${id}`), { method: "GET" });
}

export async function setStationEnabled(stationId: number, enabled: boolean) {
  return apiRequestAuth<void>(csmsApiPath(`/stations/${stationId}/status`), {
    method: "PATCH",
    body: { enabled },
  });
}

export async function setChargeBoxEnabled(chargeBoxId: string, enabled: boolean) {
  return apiRequestAuth<void>(csmsApiPath(`/chargeboxes/${chargeBoxId}/status`), {
    method: "PATCH",
    body: { enabled },
  });
}

/**
 * New per-station geo feed: `GET …/stations/geo/locations`
 * (via gateway: `/csms/stations/geo/locations`). Backend returns 404 with an
 * empty list when there are no stations; we normalize that to [].
 */
export async function fetchStationGeoLocations(): Promise<StationGeoLocation[]> {
  try {
    return await apiRequestAuth<StationGeoLocation[]>(
      csmsApiPath("/stations/geo/locations"),
      { method: "GET" },
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return [];
    throw e;
  }
}
