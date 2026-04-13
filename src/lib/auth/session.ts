import type { Phase1Response, TokenResponse } from "../types/auth";
import { isAccessTokenExpired } from "./jwt";

const KEYS = {
  accessToken: "scms_access_token",
  refreshToken: "scms_refresh_token",
  identityToken: "scms_identity_token",
  tokenType: "scms_token_type",
  expiresIn: "scms_expires_in",
  identityType: "scms_identity_type",
  role: "scms_role",
};

export function setIdentityTypeAndRole(
  identityType: string,
  role: string | undefined,
) {
  if (typeof window === "undefined") return;

  localStorage.setItem(KEYS.identityType, identityType);
  if (role) localStorage.setItem(KEYS.role, role);
}

export function setSessionFromPhase1(res: Phase1Response) {
  if (typeof window === "undefined") return;

  localStorage.setItem(KEYS.identityType, res.identityType);

  // Phase 1 responses for some identity types (e.g. CUSTOMER) do not include access/refresh tokens.
  if (res.identityToken) localStorage.setItem(KEYS.identityToken, res.identityToken);
  if (res.accessToken) localStorage.setItem(KEYS.accessToken, res.accessToken);
  if (res.refreshToken) localStorage.setItem(KEYS.refreshToken, res.refreshToken);
  if (res.tokenType) localStorage.setItem(KEYS.tokenType, res.tokenType);
  if (typeof res.expiresIn === "number")
    localStorage.setItem(KEYS.expiresIn, String(res.expiresIn));
}

export function setSessionFromTokenResponse(res: TokenResponse) {
  if (typeof window === "undefined") return;

  localStorage.setItem(KEYS.accessToken, res.accessToken);
  localStorage.setItem(KEYS.refreshToken, res.refreshToken);
  localStorage.setItem(KEYS.tokenType, res.tokenType);
  localStorage.setItem(KEYS.expiresIn, String(res.expiresIn));

  const role = res.account?.role ?? res.provider?.role;
  if (role) localStorage.setItem(KEYS.role, role);
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
  return localStorage.getItem(KEYS.refreshToken);
}

export function getStoredRole() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.role);
}

/** From login Phase 1 (`Phase1Response.identityType`), e.g. `SYSTEM_ADMIN`, `SERVICE_PROVIDER`. */
export function getStoredIdentityType() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.identityType);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

