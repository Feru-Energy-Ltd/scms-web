/**
 * Auth-service (and other Java APIs) serialize UTC instants as `LocalDateTime`
 * without a zone suffix, e.g. `2026-06-19T16:15:24`. Treat those as UTC and
 * format in the browser's local timezone.
 *
 * Jackson may also emit Instant as an epoch-second number when dates-as-timestamps
 * is enabled — `new Date(seconds)` wrongly treats that as milliseconds (→ 1970).
 *
 * With `WRITE_DATES_AS_TIMESTAMPS`, Jackson serializes `LocalDateTime` as an array:
 * `[year, month, day, hour, minute, second?, nano?]`, where month is 1-based.
 */
export type ApiDateTimeInput =
  | string
  | number
  | number[]
  | null
  | undefined;

function fromEpochNumber(n: number): Date | null {
  if (!Number.isFinite(n)) return null;
  // Epoch seconds are ~1e9–1e10; epoch milliseconds are ~1e12–1e13.
  const ms = Math.abs(n) < 1e11 ? n * 1000 : n;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Jackson LocalDateTime array: [y, M, d, H?, m?, s?, nano?] — month is 1-based. */
function fromJacksonLocalDateTimeArray(parts: number[]): Date | null {
  if (parts.length < 3) return null;
  const [year, month, day, hour = 0, minute = 0, second = 0] = parts;
  if (
    ![year, month, day, hour, minute, second].every(
      (n) => typeof n === "number" && Number.isFinite(n),
    )
  ) {
    return null;
  }
  // Construct as UTC so it matches how we treat zone-less LocalDateTime strings.
  const d = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseApiUtcDateTime(value: ApiDateTimeInput): Date | null {
  if (value == null || value === "") return null;

  if (typeof value === "number") {
    return fromEpochNumber(value);
  }

  if (Array.isArray(value)) {
    return fromJacksonLocalDateTimeArray(value);
  }

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  // Pure numeric string → epoch seconds/ms (not an ISO datetime).
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return fromEpochNumber(Number(trimmed));
  }

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

function isTodayLocal(d: Date): boolean {
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function timeOnlyOptions(
  opts?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatOptions | undefined {
  if (!opts) return undefined;
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: opts.hour,
    minute: opts.minute,
    second: opts.second,
    hour12: opts.hour12,
    hourCycle: opts.hourCycle,
    fractionalSecondDigits: opts.fractionalSecondDigits,
    timeStyle: opts.timeStyle,
    timeZone: opts.timeZone,
    timeZoneName: opts.timeZoneName,
  };
  const defined = Object.fromEntries(
    Object.entries(timeOpts).filter(([, v]) => v !== undefined),
  );
  return Object.keys(defined).length > 0 ? defined : undefined;
}

export function formatApiUtcDateTime(
  value: ApiDateTimeInput,
  opts?: Intl.DateTimeFormatOptions,
): string {
  if (value == null || value === "") return "—";
  const d = parseApiUtcDateTime(value);
  if (!d) return String(value);
  if (isTodayLocal(d)) {
    const time = d.toLocaleTimeString(undefined, timeOnlyOptions(opts));
    return `today at ${time}`;
  }
  return d.toLocaleString(undefined, opts);
}
