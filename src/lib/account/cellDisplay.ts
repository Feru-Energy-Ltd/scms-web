import { formatApiUtcDateTime } from "@/lib/datetime/formatUtc";

function asDisplayString(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  return null;
}

/** Display helper for table cells — empty/null/non-primitive → em dash. */
export function cellText(value: unknown): string {
  return asDisplayString(value) ?? "—";
}

/** Format an API UTC datetime for table display, or em dash when empty. */
export function cellDateTime(value: unknown): string {
  const raw = asDisplayString(value);
  if (raw == null) return "—";
  return formatApiUtcDateTime(raw);
}
