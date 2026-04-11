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

