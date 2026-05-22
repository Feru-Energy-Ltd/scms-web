import { apiRequestAuth } from "./http";

export async function fetchProviderStaff(providerId: number) {
  return apiRequestAuth<unknown>(
    `/auth/management/service-providers/${providerId}/staff`,
  );
}
