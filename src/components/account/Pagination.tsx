"use client";

import styles from "./Pagination.module.css";

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  disabled?: boolean;
}) {
  const pages = Math.max(totalPages, 1);
  return (
    <div className={styles.bar}>
      <button
        type="button"
        className={styles.btn}
        disabled={disabled || page <= 0}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      <span className={styles.label}>
        Page {page + 1} of {pages}
      </span>
      <button
        type="button"
        className={styles.btn}
        disabled={disabled || page >= pages - 1}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
