import { csmsApiPath } from "../config";
import { ApiError, apiRequestAuth } from "./http";

export type ChargingStation = {
  id: number;
  stationId: string;
  providerId?: number | null;
  locationLatitude?: string;
  locationLongitude?: string;
  locationAddressName: string;
  imageUrl?: string;
  chargeBoxCount: number;
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

export async function fetchStations(): Promise<ChargingStation[]> {
  const raw = await apiRequestAuth<unknown>(csmsApiPath("/stations"), {
    method: "GET",
  });
  return Array.isArray(raw) ? (raw as ChargingStation[]) : [];
}

export async function createStation(payload: CreateChargingStationPayload) {
  return apiRequestAuth<ChargingStation>(csmsApiPath("/stations"), {
    method: "POST",
    body: payload,
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
