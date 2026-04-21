import type { TokenResponse } from "../types/auth";
import { isAccessTokenExpired } from "./jwt";

const KEYS = {
  accessToken: "scms_access_token",
  refreshToken: "scms_refresh_token",
  identityToken: "scms_identity_token",
  tokenType: "scms_token_type",
  expiresIn: "scms_expires_in",
  identityType: "scms_identity_type",
  providerName: "scms_provider_name",
};

export function setIdentityType(
  identityType: string,
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.identityType, identityType);
}

export function setSessionTokensFromResponse(res: TokenResponse) {
  if (typeof window === "undefined") return;

  console.info('setSessionTokens', res)
  localStorage.setItem(KEYS.identityType, res.identityType);
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
  console.info('Keys', KEYS)
  const refreshToken = localStorage.getItem(KEYS.refreshToken);
  console.info('refreshToken', refreshToken)
  return refreshToken;
}
export function getStoredIdentityType() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.identityType);
}

/** Provider/business label for service-provider sessions. */
export function getStoredProviderName() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.providerName);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

