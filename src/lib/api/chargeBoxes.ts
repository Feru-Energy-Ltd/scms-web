import { csmsApiPath } from "../config";
import { apiRequestAuth } from "./http";

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
  /** Attach to an existing station; when omitted, the backend creates a 1:1 station. */
  stationId?: number;
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

export async function fetchChargeBoxes(page = 0, size = 20) {
  const q = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return apiRequestAuth<unknown>(csmsApiPath(`/chargeboxes?${q.toString()}`));
}

export async function fetchChargeBoxById(chargerId: string) {
  return apiRequestAuth<unknown>(csmsApiPath(`/chargeboxes/${chargerId}`));
}

export type ChargerDetail = {
  id: number;
  chargeBoxId: string;
  ocppProtocol?: string;
  chargePointVendor?: string;
  chargePointModel?: string;
  chargePointSerialNumber?: string;
  firmwareVersion?: string;
  lastHeartbeatTimestamp?: string;
  onlineStatus?: string;
  enabled?: boolean;
  stationId?: string;
};

// Mirrors csms-service SessionTransactionDto (Plan 3).
export type ChargerTransaction = {
  id: number;
  transactionId?: number;
  walletAccountNumber?: string;
  connectorId?: number;
  energyKwh?: number;
  totalDriverCost?: number;
  status?: string;
  startedAt?: string;
  stoppedAt?: string;
};

export type ChargerBooking = {
  id: number;
  username: string;
  connectorId: number;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  reservationAmount?: number;
};

type Page<T> = { content: T[]; totalElements: number; number: number };

export async function fetchChargerDetail(chargeBoxId: string): Promise<ChargerDetail> {
  // GET /chargeboxes/{id} returns ResponseObject<ChargeBox> = { status, data, code, message }.
  const raw = await apiRequestAuth<{ data?: ChargerDetail } & ChargerDetail>(
    csmsApiPath(`/chargeboxes/${chargeBoxId}`),
  );
  return (raw.data ?? raw) as ChargerDetail;
}

export async function fetchChargerTransactions(chargeBoxId: string, page = 0, size = 20) {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  return apiRequestAuth<Page<ChargerTransaction>>(
    csmsApiPath(`/chargeboxes/${chargeBoxId}/transactions?${q}`),
  );
}

export async function fetchChargerBookings(chargeBoxId: string, page = 0, size = 20) {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  return apiRequestAuth<Page<ChargerBooking>>(
    csmsApiPath(`/chargeboxes/${chargeBoxId}/reservations?${q}`),
  );
}
