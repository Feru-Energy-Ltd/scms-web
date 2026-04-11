import { apiRequestAuth } from "./http";

export async function fetchCustomers(search?: string) {
  const q = search
    ? `?${new URLSearchParams({ search }).toString()}`
    : "";
  return apiRequestAuth<unknown>(`/customers${q}`);
}
