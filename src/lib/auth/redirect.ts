/**
 * Redirect-after-login helpers.
 *
 * Captures the originally-requested protected URL when an unauthenticated user
 * is bounced to /login, and restores it after a successful sign-in.
 *
 * All values are validated as safe internal paths to prevent open-redirect
 * attacks (e.g. //evil.com, /\evil.com, https://evil.com).
 */

const DEFAULT_REDIRECT = "/account";
const NEXT_PARAM = "next";

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
  if (value === "/login" || value.startsWith("/login?")) return fallback;

  return value;
}

/**
 * Builds the login path carrying the intended destination as ?next=,
 * e.g. "/login?next=%2Faccount%2Fapprovals".
 * Skips the param when the intended path is just the default landing page.
 */
export function buildLoginPath(intendedPath: string): string {
  const target = sanitizeNextPath(intendedPath);
  if (target === DEFAULT_REDIRECT) return "/login";
  return `/login?${NEXT_PARAM}=${encodeURIComponent(target)}`;
}

/**
 * Reads and sanitizes the ?next= param from a query string.
 * Pass window.location.search (client-side only).
 */
export function resolveNextFromSearch(search: string): string {
  const params = new URLSearchParams(search);
  return sanitizeNextPath(params.get(NEXT_PARAM));
}
