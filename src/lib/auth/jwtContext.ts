import { decodeJwtPayload } from "./jwt";
import { getAccessToken } from "./session";



/**
 */



export function getAccessTokenContext(): {
  identityType?: string;
  email?: string;
  providerId?: number;
} {
  const token = getAccessToken();
  if (!token) return {};
  const p = decodeJwtPayload(token);
  if (!p) return {};

  return {
    identityType:
      typeof p.identityType === "string" ? p.identityType : "unknown identity type",
    email:
      typeof p.email === "string" ? p.email : "unknown email",
    providerId: p.provider_id as number | undefined,
  };
}
