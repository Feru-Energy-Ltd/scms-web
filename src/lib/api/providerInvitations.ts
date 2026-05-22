import { apiRequestAuth } from "./http";

function base(providerId: number) {
  return `/auth/providers/${providerId}/staff/invitations`;
}

export type ProviderStaffRole =
  | "SERVICE_PROVIDER_OWNER"
  | "SERVICE_PROVIDER_MANAGER"
  | "SERVICE_PROVIDER_STAFF";

export async function fetchProviderInvitations(providerId: number) {
  return apiRequestAuth<unknown>(base(providerId));
}

export async function sendProviderInvitation(
  providerId: number,
  body: { email: string; role: ProviderStaffRole },
) {
  return apiRequestAuth<unknown>(base(providerId), {
    method: "POST",
    body,
  });
}

export async function revokeProviderInvitation(
  providerId: number,
  invitationId: number,
) {
  return apiRequestAuth<void>(`${base(providerId)}/${invitationId}`, {
    method: "DELETE",
  });
}
