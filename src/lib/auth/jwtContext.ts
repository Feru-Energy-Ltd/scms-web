import { decodeJwtPayload } from "./jwt";
import { getAccessToken } from "./session";



/**
 */



export function getAccessTokenContext(): {
  identityType?: string;
  providerId?: number;
  userId?: number;
  role?: string;
} {
  const token = getAccessToken();
  if (!token) return {};
  const p = decodeJwtPayload(token);
  if (!p) return {};

  return {
    identityType:
      typeof p.identity_type === "string" ? p.identity_type : undefined,
    providerId:
      typeof p.provider_id === "number" ? p.provider_id : undefined,
    userId:
      typeof p.sub === "string" ? Number(p.sub) : undefined,
    role:
      typeof p.role === "string" ? p.role : undefined,
  };
}
