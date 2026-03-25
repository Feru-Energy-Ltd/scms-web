import type { Phase1Response } from "../types/auth";

const KEYS = {
  accessToken: "scms_access_token",
  refreshToken: "scms_refresh_token",
  identityToken: "scms_identity_token",
  tokenType: "scms_token_type",
  expiresIn: "scms_expires_in",
};

export function setSessionFromLogin(res: Phase1Response) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.accessToken, res.accessToken);
  localStorage.setItem(KEYS.refreshToken, res.refreshToken);
  localStorage.setItem(KEYS.identityToken, res.identityToken);
  localStorage.setItem(KEYS.tokenType, res.tokenType);
  localStorage.setItem(KEYS.expiresIn, String(res.expiresIn));
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.accessToken);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

