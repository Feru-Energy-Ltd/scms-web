"use client";

import { useEffect, useId } from "react";
import styles from "./ConfirmModal.module.css";

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  confirmDestructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmDestructive,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [loading, onCancel]);

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={() => {
        if (!loading) onCancel();
      }}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className={styles.modalTitle}>
          {title}
        </h2>
        <p id={descId} className={styles.modalMessage}>
          {message}
        </p>
        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={
              confirmDestructive ? styles.destructiveBtn : styles.primaryBtn
            }
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
