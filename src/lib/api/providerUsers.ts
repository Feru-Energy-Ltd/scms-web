import { apiRequestAuth } from "./http";

export type ProviderStaffRole =
  | "SERVICE_PROVIDER_OWNER"
  | "SERVICE_PROVIDER_MANAGER"
  | "SERVICE_PROVIDER_STAFF";

export interface StaffMember {
  userId: number;
  email: string;
  displayName: string;
  role: string;
  status: string;
}

export async function fetchProviderStaff(providerId: number): Promise<StaffMember[]> {
  return apiRequestAuth<StaffMember[]>(`/auth/providers/${providerId}/staff`);
}

export async function updateStaffRole(
  providerId: number,
  userId: number,
  role: ProviderStaffRole,
): Promise<StaffMember> {
  return apiRequestAuth<StaffMember>(`/auth/providers/${providerId}/staff/${userId}`, {
    method: "PUT",
    body: { role },
  });
}

export async function suspendStaff(
  providerId: number,
  userId: number,
): Promise<void> {
  await apiRequestAuth<void>(`/auth/providers/${providerId}/staff/${userId}`, {
    method: "DELETE",
  });
}
