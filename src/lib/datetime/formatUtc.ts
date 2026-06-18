/**
 * Auth-service (and other Java APIs) serialize UTC instants as `LocalDateTime`
 * without a zone suffix, e.g. `2026-06-19T16:15:24`. Treat those as UTC and
 * format in the browser's local timezone.
 */
export function parseApiUtcDateTime(
  value: string | null | undefined,
): Date | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const normalized = trimmed.includes("T")
    ? trimmed
    : trimmed.replace(" ", "T");
  const d = new Date(`${normalized}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatApiUtcDateTime(
  value: string | null | undefined,
  opts?: Intl.DateTimeFormatOptions,
): string {
  if (value == null || value === "") return "—";
  const d = parseApiUtcDateTime(value);
  if (!d) return String(value);
  return d.toLocaleString(undefined, opts);
}
