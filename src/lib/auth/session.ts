import type { TokenResponse } from "../types/auth";
import { isAccessTokenExpired } from "./jwt";
import { decodeJwtPayload } from "./jwt";

const KEYS = {
  accessToken: "scms_access_token",
  refreshToken: "scms_refresh_token",
  identityToken: "scms_identity_token",
  tokenType: "scms_token_type",
  expiresIn: "scms_expires_in",
  identityType: "scms_identity_type",
  roleCode: "scms_role_code",
};

export function setIdentityType(
  identityType: string,
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.identityType, identityType);
}

export function setSessionTokensFromResponse(res: TokenResponse) {
  if (typeof window === "undefined") return;

  localStorage.setItem(KEYS.identityToken, res.identityToken);
  localStorage.setItem(KEYS.accessToken, res.accessToken);
  localStorage.setItem(KEYS.refreshToken, res.refreshToken);
  localStorage.setItem(KEYS.expiresIn, String(res.expiresIn));
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.accessToken);
}

/** Non-expired access token present (same bar as account routes). */
export function hasActiveAccessSession(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  return !isAccessTokenExpired(token);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  const refreshToken = localStorage.getItem(KEYS.refreshToken);
  return refreshToken;
}
export function getStoredIdentityType() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.identityType);
}

export function getStoredRoleCode() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.roleCode);
}

/**
 * Extract permissions array from the stored access token JWT.
 * Returns empty array if no token or no permissions claim.
 */
export function getStoredPermissions(): string[] {
  if (typeof window === "undefined") return [];
  const token = localStorage.getItem(KEYS.accessToken);
  if (!token) return [];
  try {
    const payload = decodeJwtPayload(token);
    if (!payload) return [];
    const perms = payload.permissions;
    return Array.isArray(perms) ? perms.map(String) : [];
  } catch {
    return [];
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}
