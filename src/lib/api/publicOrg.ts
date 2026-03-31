import { apiRequest } from "./http";

export async function verifyOrganizationToken(token: string) {
  return apiRequest<unknown>(
    `/public/organization/verify/token/${encodeURIComponent(token)}`,
  );
}

export async function verifyOrganizationMemberToken(token: string) {
  return apiRequest<unknown>(
    `/public/organization/member/verify/token/${encodeURIComponent(token)}`,
  );
}
