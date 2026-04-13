import { apiRequestAuth } from "./http";

const BASE = "/auth/management/service-providers";

export async function fetchPendingServiceProviders(page = 0, size = 20) {
  const q = new URLSearchParams({
    status: "PENDING",
    page: String(page),
    size: String(size),
  });
  return apiRequestAuth<unknown>(`${BASE}?${q}`);
}

export async function setServiceProviderStatus(
  id: number,
  status: "ACTIVE" | "SUSPENDED",
) {
  return apiRequestAuth<void>(`${BASE}/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}
