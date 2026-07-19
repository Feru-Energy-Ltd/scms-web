import { csmsApiPath } from "../config";
import { asArray, unwrapData } from "./normalize";
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

export type ChargeBoxListOpts = {
  stationId?: number;
  enabled?: boolean;
  /** Backend enum name: "Accepted" | "Rejected". */
  registrationStatus?: RegistrationStatus;
  /** Backend enum name: "ON" | "OFF". */
  onlineStatus?: "ON" | "OFF";
  search?: string;
};

export async function fetchChargeBoxes(
  page = 0,
  size = 20,
  opts: ChargeBoxListOpts = {},
) {
  const q = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (opts.stationId != null) q.set("stationId", String(opts.stationId));
  if (opts.enabled != null) q.set("enabled", String(opts.enabled));
  if (opts.registrationStatus) q.set("registrationStatus", opts.registrationStatus);
  if (opts.onlineStatus) q.set("onlineStatus", opts.onlineStatus);
  if (opts.search && opts.search.trim()) q.set("search", opts.search.trim());
  return apiRequestAuth<unknown>(csmsApiPath(`/chargeboxes?${q.toString()}`));
}

export async function fetchChargeBoxById(chargerId: string) {
  return apiRequestAuth<unknown>(csmsApiPath(`/chargeboxes/${chargerId}`));
}

export async function deleteChargeBox(chargeBoxId: string) {
  return apiRequestAuth<unknown>(
    csmsApiPath(`/chargeboxes/${encodeURIComponent(chargeBoxId)}`),
    { method: "DELETE" },
  );
}

export type RegistrationStatus = "Accepted" | "Rejected";

export type ChargeBoxStation = {
  id?: number;
  stationId?: string;
  locationLatitude?: string | null;
  locationLongitude?: string | null;
  locationAddressName?: string | null;
  imageUrl?: string | null;
};

/** Full charge box entity returned by GET /chargeboxes/{id}. */
export type ChargeBoxFullDetail = {
  id: number;
  chargeBoxId: string;
  description?: string | null;
  note?: string | null;
  registrationStatus?: RegistrationStatus | null;
  onlineStatus?: string | null;
  ocppProtocol?: string | null;
  chargePointVendor?: string | null;
  chargePointModel?: string | null;
  chargePointSerialNumber?: string | null;
  firmwareVersion?: string | null;
  lastHeartbeatTimestamp?: string | null;
  type?: string | null;
  currentType?: string | null;
  idTag?: string | null;
  enabled?: boolean;
  station?: ChargeBoxStation | null;
};

export type UpdateChargeBoxInfoPayload = {
  id: number;
  description?: string;
  note?: string;
};

export type UpdateChargeBoxLocationPayload = {
  id: number;
  latitude?: string;
  longitude?: string;
};

export type UpdateChargeBoxSettingsPayload = {
  chargeBoxId: string;
  registrationStatus: RegistrationStatus;
};

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function parseChargeBoxFullDetail(raw: unknown): ChargeBoxFullDetail | null {
  const data = unwrapData<Record<string, unknown>>(raw);
  if (!data) return null;

  const id = asNumber(data.id);
  const chargeBoxId =
    typeof data.chargeBoxId === "string" ? data.chargeBoxId : null;
  if (id == null || !chargeBoxId) return null;

  const stationRaw = data.station;
  const station =
    stationRaw && typeof stationRaw === "object"
      ? (stationRaw as ChargeBoxStation)
      : null;

  return {
    id,
    chargeBoxId,
    description: typeof data.description === "string" ? data.description : null,
    note: typeof data.note === "string" ? data.note : null,
    registrationStatus:
      data.registrationStatus === "Accepted" ||
      data.registrationStatus === "Rejected"
        ? data.registrationStatus
        : null,
    onlineStatus:
      typeof data.onlineStatus === "string" ? data.onlineStatus : null,
    ocppProtocol:
      typeof data.ocppProtocol === "string" ? data.ocppProtocol : null,
    chargePointVendor:
      typeof data.chargePointVendor === "string"
        ? data.chargePointVendor
        : null,
    chargePointModel:
      typeof data.chargePointModel === "string" ? data.chargePointModel : null,
    chargePointSerialNumber:
      typeof data.chargePointSerialNumber === "string"
        ? data.chargePointSerialNumber
        : null,
    firmwareVersion:
      typeof data.firmwareVersion === "string" ? data.firmwareVersion : null,
    lastHeartbeatTimestamp:
      typeof data.lastHeartbeatTimestamp === "string"
        ? data.lastHeartbeatTimestamp
        : null,
    type: typeof data.type === "string" ? data.type : null,
    currentType: typeof data.currentType === "string" ? data.currentType : null,
    idTag: typeof data.idTag === "string" ? data.idTag : null,
    enabled: typeof data.enabled === "boolean" ? data.enabled : undefined,
    station,
  };
}

export async function fetchChargeBoxFullDetail(
  chargeBoxId: string,
): Promise<ChargeBoxFullDetail> {
  const raw = await fetchChargeBoxById(chargeBoxId);
  const parsed = parseChargeBoxFullDetail(raw);
  if (!parsed) {
    throw new Error("Unexpected charger response from server.");
  }
  return parsed;
}

export async function updateChargeBoxInfo(
  chargeBoxId: string,
  payload: UpdateChargeBoxInfoPayload,
) {
  return apiRequestAuth<unknown>(
    csmsApiPath(`/chargeboxes/${chargeBoxId}/info`),
    { method: "PUT", body: payload },
  );
}

export async function updateChargeBoxLocation(
  chargeBoxId: string,
  payload: UpdateChargeBoxLocationPayload,
) {
  return apiRequestAuth<unknown>(
    csmsApiPath(`/chargeboxes/${chargeBoxId}/location`),
    { method: "PUT", body: payload },
  );
}

export async function updateChargeBoxSettings(
  chargeBoxId: string,
  payload: UpdateChargeBoxSettingsPayload,
) {
  return apiRequestAuth<unknown>(
    csmsApiPath(`/chargeboxes/${chargeBoxId}/settings`),
    { method: "PUT", body: payload },
  );
}

export type ChargeBoxConnector = {
  id: number;
  connectorId: number;
  currentType: "AC" | "DC";
  connectorType: CreateChargeBoxConnectorPayload["connectorType"];
  status?: string | null;
};

export type ConnectorSlotDraft = {
  key: string;
  connectorId: number;
  currentType: "AC" | "DC";
  connectorType: CreateChargeBoxConnectorPayload["connectorType"];
};

function parseChargeBoxConnector(raw: unknown): ChargeBoxConnector | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = asNumber(row.id);
  const connectorId = asNumber(row.connectorId);
  const currentType = row.currentType === "AC" || row.currentType === "DC"
    ? row.currentType
    : null;
  const connectorType =
    typeof row.connectorType === "string" &&
    (CHARGE_BOX_CONNECTOR_TYPES as readonly string[]).includes(row.connectorType)
      ? (row.connectorType as ChargeBoxConnector["connectorType"])
      : null;
  if (id == null || connectorId == null || !currentType || !connectorType) {
    return null;
  }
  return {
    id,
    connectorId,
    currentType,
    connectorType,
    status: typeof row.status === "string" ? row.status : null,
  };
}

export function parseChargeBoxConnectors(raw: unknown): ChargeBoxConnector[] {
  const unwrapped = unwrapData<unknown>(raw);
  const list = asArray<unknown>(unwrapped ?? raw);
  return list
    .map(parseChargeBoxConnector)
    .filter((row): row is ChargeBoxConnector => row != null)
    .sort((a, b) => a.connectorId - b.connectorId);
}

export function connectorsToDrafts(
  connectors: ChargeBoxConnector[],
): ConnectorSlotDraft[] {
  return connectors.map((connector) => ({
    key: `connector-${connector.connectorId}`,
    connectorId: connector.connectorId,
    currentType: connector.currentType,
    connectorType: connector.connectorType,
  }));
}

export function draftsToConnectorPayload(
  slots: ConnectorSlotDraft[],
): CreateChargeBoxConnectorPayload[] {
  return slots.map((slot) => ({
    connectorId: slot.connectorId,
    currentType: slot.currentType,
    connectorType: slot.connectorType,
  }));
}

export function nextConnectorId(slots: ConnectorSlotDraft[]): number {
  if (slots.length === 0) return 1;
  return Math.max(...slots.map((slot) => slot.connectorId)) + 1;
}

export async function fetchChargeBoxConnectors(
  chargeBoxId: string,
): Promise<ChargeBoxConnector[]> {
  const raw = await apiRequestAuth<unknown>(
    csmsApiPath(`/chargeboxes/${chargeBoxId}/connectors`),
  );
  return parseChargeBoxConnectors(raw);
}

export async function replaceChargeBoxConnectors(
  chargeBoxId: string,
  connectors: CreateChargeBoxConnectorPayload[],
) {
  return apiRequestAuth<unknown>(
    csmsApiPath(`/chargeboxes/${chargeBoxId}/connectors`),
    { method: "PUT", body: connectors },
  );
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
  /** Instant — ISO string or Jackson epoch-second number. */
  startedAt?: string | number;
  stoppedAt?: string | number;
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

// Mirrors csms-service ReservationSummaryDto (estate-wide reservation listing).
export type ReservationSummary = {
  id: number;
  chargeBoxId: string;
  connectorId: number;
  username: string;
  idTag: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  reservationAmount?: number;
  providerId?: number | null;
  locationAddress?: string | null;
  plateNumber?: string | null;
};

export type ReservationListOpts = {
  /** Only return currently-active reservations (Accepted/Occupied/Pending). */
  active?: boolean;
  /** Admins only: drill down into a single provider's reservations. */
  providerId?: number;
};

type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
};

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

/**
 * Estate-wide reservation listing. Admins see all reservations; providers are automatically
 * scoped to their own chargers by the backend. Set `opts.active` for only live reservations.
 */
export async function fetchReservations(
  page = 0,
  size = 20,
  opts: ReservationListOpts = {},
) {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  if (opts.providerId != null) q.set("providerId", String(opts.providerId));
  const path = opts.active
    ? "/chargeboxes/reservations/active"
    : "/chargeboxes/reservations";
  return apiRequestAuth<Page<ReservationSummary>>(csmsApiPath(`${path}?${q}`));
}
