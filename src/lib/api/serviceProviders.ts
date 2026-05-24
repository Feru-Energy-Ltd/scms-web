import { apiRequestAuth } from "./http";

const BASE = "/auth/management/service-providers";

export async function fetchPendingServiceProviders(page = 0, size = 20, search?: string) {
  const q = new URLSearchParams({
    status: "PENDING",
    page: String(page),
    size: String(size),
  });
  if (search) {
    q.set("search", search);
  }
  return apiRequestAuth<unknown>(`${BASE}?${q}`);
}

export interface ProviderListItem {
  id: number;
  businessName: string;
  displayName: string;
  status: string;
}

export async function fetchActiveProviders(): Promise<ProviderListItem[]> {
  const q = new URLSearchParams({ status: "ACTIVE", size: "200" });
  const res = await apiRequestAuth<{ content: ProviderListItem[] }>(`${BASE}?${q}`);
  return res.content ?? [];
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
