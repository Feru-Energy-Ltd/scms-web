"use client";

import { useEffect, useId, useState } from "react";
import { Trash2, X } from "lucide-react";
import styles from "./ChargerStatusModal.module.css";

export type DeleteResourceModalField = {
  label: string;
  value: string;
  wide?: boolean;
};

export type DeleteResourceModalProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  resourceLabel: string;
  resourceId: string;
  statusBadge?: string;
  fields?: DeleteResourceModalField[];
  impactItems: string[];
  acknowledgment: string;
  confirmLabel: string;
  loading?: boolean;
  /** When set, confirm stays disabled and this message is shown instead of the ack checkbox. */
  blockReason?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function DeleteResourceModal({
  eyebrow,
  title,
  subtitle,
  resourceLabel,
  resourceId,
  statusBadge,
  fields = [],
  impactItems,
  acknowledgment,
  confirmLabel,
  loading = false,
  blockReason = null,
  onConfirm,
  onCancel,
}: DeleteResourceModalProps) {
  const titleId = useId();
  const descId = useId();
  const ackId = useId();
  const [acknowledged, setAcknowledged] = useState(false);
  const blocked = Boolean(blockReason);
  const canConfirm = !blocked && acknowledged;

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
        <header className={styles.header}>
          <div className={styles.iconDanger} aria-hidden>
            <Trash2 size={22} />
          </div>
          <div className={styles.headerText}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <p id={descId} className={styles.subtitle}>
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="Close"
            onClick={onCancel}
            disabled={loading}
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <section className={styles.summary} aria-label="Resource summary">
          <div className={styles.summaryTop}>
            <div>
              <p className={styles.summaryLabel}>{resourceLabel}</p>
              <p className={styles.summaryId}>{resourceId}</p>
            </div>
            {statusBadge ? (
              <span className={styles.badgeDisabled}>{statusBadge}</span>
            ) : null}
          </div>

          {fields.length > 0 ? (
            <dl className={styles.metaGrid}>
              {fields.map((field) => (
                <div
                  key={field.label}
                  className={field.wide ? styles.metaWide : undefined}
                >
                  <dt>{field.label}</dt>
                  <dd>{field.value && field.value !== "—" ? field.value : "—"}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>

        <section className={styles.impactDanger} aria-label="What will change">
          <h3 className={styles.impactTitle}>What will change</h3>
          <ul className={styles.impactList}>
            {impactItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        {blocked ? (
          <p className={styles.ack} role="status">
            {blockReason}
          </p>
        ) : (
          <label className={styles.ack} htmlFor={ackId}>
            <input
              id={ackId}
              type="checkbox"
              checked={acknowledged}
              disabled={loading}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
            <span>{acknowledgment}</span>
          </label>
        )}

        <footer className={styles.footer}>
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
            className={styles.destructiveBtn}
            onClick={onConfirm}
            disabled={loading || !canConfirm}
          >
            {loading ? "Deleting…" : confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
