"use client";

import styles from "@/components/account/ResourceList.module.css";

type DateRangeFiltersProps = {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onClear: () => void;
};

/** Convert YYYY-MM-DD inputs to inclusive UTC day bounds for API queries. */
export function toIsoDayBounds(from: string, to: string): { from?: string; to?: string } {
  return {
    from: from ? `${from}T00:00:00.000Z` : undefined,
    to: to ? `${to}T23:59:59.999Z` : undefined,
  };
}

export function DateRangeHint({
  from,
  to,
  selectedHint,
}: {
  from: string;
  to: string;
  selectedHint: string;
}) {
  return (
    <p className={styles.muted} style={{ fontSize: "0.8rem", marginTop: "-0.25rem" }}>
      {from || to
        ? selectedHint
        : "Showing the last 90 days by default. Use the date filters to change the range."}
    </p>
  );
}

export default function DateRangeFilters({
  from,
  to,
  onFromChange,
  onToChange,
  onClear,
}: DateRangeFiltersProps) {
  return (
    <>
      <label className={styles.muted} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span>From</span>
        <input
          type="date"
          className={styles.searchInput}
          value={from}
          max={to || undefined}
          onChange={(e) => onFromChange(e.target.value)}
        />
      </label>
      <label className={styles.muted} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span>To</span>
        <input
          type="date"
          className={styles.searchInput}
          value={to}
          min={from || undefined}
          onChange={(e) => onToChange(e.target.value)}
        />
      </label>
      {(from || to) && (
        <button type="button" className={styles.button} onClick={onClear}>
          Clear dates
        </button>
      )}
    </>
  );
}
