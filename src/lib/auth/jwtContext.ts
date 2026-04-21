import { decodeJwtPayload } from "./jwt";
import { getAccessToken } from "./session";



/**
 */



export function getAccessTokenContext(): {
  identityType?: string;
  email?: string;
} {
  const token = getAccessToken();
  if (!token) return {};
  const p = decodeJwtPayload(token);
  if (!p) return {};

  return {
    identityType:
      typeof p.identityType === "string" ? p.identityType : undefined,
    email:
      typeof p.email === "string" ? p.email : undefined,
  };
}
