import { apiRequestAuth } from "./http";

export async function fetchOrganizations(
  params?: Record<string, string | number | undefined>,
) {
  const search = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") search.set(k, String(v));
    }
  }
  const q = search.toString();
  return apiRequestAuth<unknown>(
    q ? `/organizations?${q}` : "/organizations",
  );
}

export async function fetchOrganizationUsers(
  orgId: number,
  search?: string,
) {
  const q = search
    ? `?${new URLSearchParams({ search }).toString()}`
    : "";
  return apiRequestAuth<unknown>(`/organizations/users/${orgId}${q}`);
}
