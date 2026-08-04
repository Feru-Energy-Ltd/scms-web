/**
 * Redirect-after-login helpers.
 *
 * Captures the originally-requested protected URL when an unauthenticated user
 * is bounced to / (sign-in), and restores it after a successful sign-in.
 *
 * All values are validated as safe internal paths to prevent open-redirect
 * attacks (e.g. //evil.com, /\evil.com, https://evil.com).
 */

const DEFAULT_REDIRECT = "/account";
const NEXT_PARAM = "next";
const PORTAL_PARAM = "portal";

export type LoginPortal = "admin" | "provider";

// Matches ASCII control characters (NUL..US and DEL) used in URL smuggling.
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

/**
 * Returns a safe internal path, or the default if the input is missing,
 * malformed, or points off-site.
 */
export function sanitizeNextPath(
  raw: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT
): string {
  if (!raw) return fallback;

  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    return fallback;
  }

  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (CONTROL_CHARS.test(value)) return fallback;
  if (value === "/" || value.startsWith("/?")) return fallback;
  if (value === "/login" || value.startsWith("/login?")) return fallback;

  return value;
}

/**
 * Reads ?portal= from a query string. Only "admin" selects the admin portal;
 * anything else (including missing) defaults to provider.
 */
export function resolvePortalFromSearch(search: string): LoginPortal {
  const query = search.startsWith("?") ? search.slice(1) : search;
  for (const pair of query.split("&")) {
    const eq = pair.indexOf("=");
    const key = eq === -1 ? pair : pair.slice(0, eq);
    if (key !== PORTAL_PARAM) continue;
    const raw = eq === -1 ? "" : pair.slice(eq + 1);
    let value = raw;
    try {
      value = decodeURIComponent(raw);
    } catch {
      return "provider";
    }
    return value === "admin" ? "admin" : "provider";
  }
  return "provider";
}

export function portalFromIdentityType(
  identityType: string | null | undefined,
): LoginPortal {
  return identityType === "SYSTEM_ADMIN" ? "admin" : "provider";
}

export function identityTypeFromPortal(
  portal: LoginPortal,
): "SYSTEM_ADMIN" | "SERVICE_PROVIDER" {
  return portal === "admin" ? "SYSTEM_ADMIN" : "SERVICE_PROVIDER";
}

/**
 * Builds the login path carrying ?next= and optional ?portal=admin.
 * Provider portal omits the portal param (cleaner default URLs).
 * Skips next when the intended path is just the default landing page.
 */
export function buildLoginPath(
  intendedPath: string,
  portal?: LoginPortal,
): string {
  const target = sanitizeNextPath(intendedPath);
  const params = new URLSearchParams();
  if (target !== DEFAULT_REDIRECT) {
    params.set(NEXT_PARAM, target);
  }
  if (portal === "admin") {
    params.set(PORTAL_PARAM, "admin");
  }
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

/** Forgot-password path, preserving portal when admin. */
export function buildForgotPasswordPath(portal: LoginPortal = "provider"): string {
  if (portal === "admin") {
    return `/auth/reset-password?${PORTAL_PARAM}=admin`;
  }
  return "/auth/reset-password";
}

/**
 * Reads and sanitizes the ?next= param from a query string.
 * Pass window.location.search (client-side only).
 *
 * Extracts the RAW (still percent-encoded) param value rather than using
 * URLSearchParams.get(), which would decode it. sanitizeNextPath owns the
 * single decode — this keeps exactly one decode layer (no corruption of
 * %-encoded query values) and lets the decode normalize encoded-slash
 * open-redirect tricks (e.g. /%2F%2Fevil.com -> //evil.com -> rejected).
 */
export function resolveNextFromSearch(search: string): string {
  const query = search.startsWith("?") ? search.slice(1) : search;
  for (const pair of query.split("&")) {
    const eq = pair.indexOf("=");
    const key = eq === -1 ? pair : pair.slice(0, eq);
    if (key === NEXT_PARAM) {
      const raw = eq === -1 ? "" : pair.slice(eq + 1);
      return sanitizeNextPath(raw);
    }
  }
  return sanitizeNextPath(null);
}
