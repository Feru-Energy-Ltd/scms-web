import { decodeJwtPayload } from "./jwt";
import { getAccessToken } from "./session";

function pickNumber(...candidates: unknown[]): number | null {
  for (const c of candidates) {
    if (typeof c === "number" && !Number.isNaN(c)) return c;
    if (typeof c === "string" && /^\d+$/.test(c)) return Number(c);
  }
  return null;
}

/**
 * Best-effort organization id from the access token (legacy APIs expect this for org-scoped lists).
 */
/** Provider id from the access token (`provider_id` claim) for service provider sessions. */
export function getProviderIdFromAccessToken(): number | null {
  const token = getAccessToken();
  if (!token) return null;
  const p = decodeJwtPayload(token);
  if (!p) return null;
  return pickNumber(p.provider_id, p.providerId);
}

export function getOrganizationIdFromAccessToken(): number | null {
  const token = getAccessToken();
  if (!token) return null;
  const p = decodeJwtPayload(token);
  if (!p) return null;

  const user = p.user as Record<string, unknown> | undefined;
  const org =
    (user?.organization as Record<string, unknown> | undefined) ??
    (p.organization as Record<string, unknown> | undefined);

  return pickNumber(
    org?.id,
    p.orgId,
    p.organizationId,
    user?.organizationId,
  );
}

export function getAccessTokenContext(): {
  organizationName?: string;
  email?: string;
  role?: string;
} {
  const token = getAccessToken();
  if (!token) return {};
  const p = decodeJwtPayload(token);
  if (!p) return {};

  const user = p.user as Record<string, unknown> | undefined;
  const org =
    (user?.organization as Record<string, unknown> | undefined) ??
    (p.organization as Record<string, unknown> | undefined);

  const roleObj = user?.role as Record<string, unknown> | string | undefined;
  const roleName =
    typeof roleObj === "string"
      ? roleObj
      : typeof roleObj === "object" && roleObj && "name" in roleObj
        ? String(roleObj.name)
        : typeof p.role === "string"
          ? p.role
          : undefined;

  return {
    organizationName:
      typeof org?.name === "string" ? org.name : undefined,
    email:
      (typeof user?.email === "string" && user.email) ||
      (typeof p.email === "string" ? p.email : undefined),
    role: roleName,
  };
}
