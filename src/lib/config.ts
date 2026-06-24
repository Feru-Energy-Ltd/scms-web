export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8183";

/**
 * Path segment in front of CSMS REST routes when using the API gateway (e.g. `/csms`
 * for `GET /csms/chargeboxes/...`). Set to empty string if your base URL already
 * targets the CSMS service root.
 */
export const CSMS_PATH_PREFIX =
  process.env.NEXT_PUBLIC_CSMS_PATH_PREFIX !== undefined
    ? process.env.NEXT_PUBLIC_CSMS_PATH_PREFIX
    : "/csms";

/** Build a path such as `/csms/chargeboxes/geo/locations` or `/chargeboxes/...` when prefix is empty. */
export function csmsApiPath(relativePath: string): string {
  const rel = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  const pre = CSMS_PATH_PREFIX.replace(/\/$/, "");
  if (!pre) return rel;
  return `${pre}${rel}`;
}

/**
 * Path segment in front of Payment REST routes when using the API gateway (e.g. `/payment`
 * for `GET /payment/operators/...`). Set to empty string if your base URL already
 * targets the Payment service root.
 */
export const PAYMENT_PATH_PREFIX =
  process.env.NEXT_PUBLIC_PAYMENT_PATH_PREFIX !== undefined
    ? process.env.NEXT_PUBLIC_PAYMENT_PATH_PREFIX
    : "/payment";

/** Build a path such as `/payment/operators/1/dashboard` or `/operators/...` when prefix is empty. */
export function paymentApiPath(relativePath: string): string {
  const rel = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  const pre = PAYMENT_PATH_PREFIX.replace(/\/$/, "");
  if (!pre) return rel;
  return `${pre}${rel}`;
}

/**
 * Path segment in front of Auth REST routes when using the API gateway (e.g. `/auth`
 * for `GET /auth/profile`). Set to empty string if your base URL already
 * targets the Auth service root.
 */
export const AUTH_PATH_PREFIX =
  process.env.NEXT_PUBLIC_AUTH_PATH_PREFIX !== undefined
    ? process.env.NEXT_PUBLIC_AUTH_PATH_PREFIX
    : "/auth";

/** Build a path such as `/auth/profile` or `/profile` when prefix is empty. */
export function authApiPath(relativePath: string): string {
  const rel = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  const pre = AUTH_PATH_PREFIX.replace(/\/$/, "");
  if (!pre) return rel;
  return `${pre}${rel}`;
}

/**
 * Path segment in front of Support REST routes when using the API gateway (e.g. `/support`
 * for `GET /support/tickets`). Set to empty string if your base URL already
 * targets the Support service root.
 */
export const SUPPORT_PATH_PREFIX =
  process.env.NEXT_PUBLIC_SUPPORT_PATH_PREFIX !== undefined
    ? process.env.NEXT_PUBLIC_SUPPORT_PATH_PREFIX
    : "/support";

/** Build a path such as `/support/tickets` or `/tickets` when prefix is empty. */
export function supportApiPath(relativePath: string): string {
  const rel = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  const pre = SUPPORT_PATH_PREFIX.replace(/\/$/, "");
  if (!pre) return rel;
  return `${pre}${rel}`;
}

