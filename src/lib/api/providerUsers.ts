import { apiRequestAuth } from "./http";

export async function fetchProviderUsers(providerId: number) {
  return apiRequestAuth<unknown>(`/auth/providers/${providerId}/staff`);
}