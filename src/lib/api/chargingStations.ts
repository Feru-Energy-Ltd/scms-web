import { csmsApiPath } from "../config";
import { ApiError, apiRequestAuth } from "./http";

/** Must match `com.safaricharge.csms.models.chargeboxes.ConnectorType`. */
export const CHARGE_BOX_CONNECTOR_TYPES = [
  "AC_TYPE1_SEA_J1772",
  "AC_TYPE2_MENNEKES",
  "AC_GBT",
  "DC_GBT",
  "DC_CHAdeMO",
  "DC_CHAOJI_CHAdeMO3",
  "DC_TYPE1_CCS1",
  "DC_TYPE2_CCS2",
  "TESLA",
] as const;

export type CreateChargeBoxConnectorPayload = {
  connectorId: number;
  currentType: "AC" | "DC";
  connectorType: (typeof CHARGE_BOX_CONNECTOR_TYPES)[number];
};

export type CreateChargeBoxPayload = {
  chargeBoxId: string;
  ocppProtocol?: "OCPP_J16" | "OCPP_J20" | "OCPP_J21";
  description?: string;
  locationLatitude?: string;
  locationLongitude?: string;
  locationAddressName: string;
  currentType: "AC" | "DC" | "DUAL_CHARGER";
  numberOfConnectors: number;
  connectors: CreateChargeBoxConnectorPayload[];
  type: "HOME" | "PUBLIC";
  imageBase64: string;
  idTag: string;
};

export async function createChargeBox(payload: CreateChargeBoxPayload) {
  return apiRequestAuth<unknown>(csmsApiPath("/chargeboxes"), {
    method: "POST",
    body: payload,
  });
}

/**
 * CSMS geo list: `GET …/chargeboxes/geo/locations` (via gateway: `/csms/chargeboxes/geo/locations`).
 * Backend returns 404 with an empty list when there are no locations; we normalize that to [].
 */
export async function fetchChargeBoxGeoLocations() {
  try {
    return await apiRequestAuth<unknown>(csmsApiPath("/chargeboxes/geo/locations"), {
      method: "GET",
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      return [];
    }
    throw e;
  }
}

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
