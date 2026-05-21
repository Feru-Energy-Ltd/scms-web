import { apiRequestAuth } from "./http";

export async function fetchCustomers(page = 0, size = 20, search?: string) {
  const q = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (search) {
    q.set("search", search);
  }
  return apiRequestAuth<unknown>(`/auth/management/customers?${q.toString()}`);
}
