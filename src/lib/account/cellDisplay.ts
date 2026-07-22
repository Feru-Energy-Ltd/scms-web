import { formatApiUtcDateTime } from "@/lib/datetime/formatUtc";

/** Display helper for table cells — empty/null → em dash. */
export function cellText(value: unknown): string {
  if (value == null || value === "") return "—";
  return String(value);
}

/** Format an API UTC datetime for table display, or em dash when empty. */
export function cellDateTime(value: unknown): string {
  if (value == null || value === "") return "—";
  return formatApiUtcDateTime(String(value));
}
