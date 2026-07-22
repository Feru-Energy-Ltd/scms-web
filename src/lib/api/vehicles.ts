import { csmsApiPath } from "../config";
import { apiRequestAuth, type Page } from "./http";

/** Must match `com.safaricharge.csms.models.chargeboxes.ConnectorType`. */
export type VehicleConnectorType =
  | "AC_TYPE1_SEA_J1772"
  | "AC_TYPE2_MENNEKES"
  | "AC_GBT"
  | "DC_GBT"
  | "DC_CHAdeMO"
  | "DC_CHAOJI_CHAdeMO3"
  | "DC_TYPE1_CCS1"
  | "DC_TYPE2_CCS2"
  | "TESLA";

export type Vehicle = {
  id: number;
  ownerId: number;
  plateNumber: string;
  vinNumber?: string | null;
  description?: string | null;
  active: boolean;
  connectorType?: VehicleConnectorType | string | null;
  batteryCapacity: number;
  imageUrl?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
};

export type FetchVehiclesOptions = {
  search?: string;
  active?: boolean;
  page?: number;
  size?: number;
};

export async function fetchVehicles(
  opts: FetchVehiclesOptions = {},
): Promise<Page<Vehicle>> {
  const { search, active, page = 0, size = 20 } = opts;
  const q = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (search?.trim()) q.set("search", search.trim());
  if (active != null) q.set("active", String(active));
  return apiRequestAuth<Page<Vehicle>>(csmsApiPath(`/vehicles?${q}`));
}

export async function setVehicleActive(
  vehicleId: number,
  active: boolean,
): Promise<void> {
  await apiRequestAuth<void>(csmsApiPath(`/vehicles/${vehicleId}/status`), {
    method: "PATCH",
    body: { active },
  });
}
