"use client";

import { useEffect, useId, useState } from "react";
import { Power, PowerOff, X } from "lucide-react";
import styles from "./ChargerStatusModal.module.css";

export type ChargerStatusModalTarget = {
  id: string;
  enabled: boolean;
  station?: string;
  address?: string;
  onlineStatus?: string;
  registration?: string;
};

type Props = {
  charger: ChargerStatusModalTarget;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ChargerStatusModal({
  charger,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const titleId = useId();
  const descId = useId();
  const ackId = useId();
  const disabling = charger.enabled;
  const [acknowledged, setAcknowledged] = useState(false);

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

  const canConfirm = !disabling || acknowledged;

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
          <div
            className={disabling ? styles.iconDanger : styles.iconSuccess}
            aria-hidden
          >
            {disabling ? <PowerOff size={22} /> : <Power size={22} />}
          </div>
          <div className={styles.headerText}>
            <p className={styles.eyebrow}>Charger availability</p>
            <h2 id={titleId} className={styles.title}>
              {disabling ? "Disable charger" : "Enable charger"}
            </h2>
            <p id={descId} className={styles.subtitle}>
              {disabling
                ? "This station unit will stop accepting new charging sessions until it's enabled again."
                : "This station unit will become available for new charging sessions again."}
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

        <section className={styles.summary} aria-label="Charger summary">
          <div className={styles.summaryTop}>
            <div>
              <p className={styles.summaryLabel}>Charge box ID</p>
              <p className={styles.summaryId}>{charger.id}</p>
            </div>
            <span
              className={
                charger.enabled ? styles.badgeEnabled : styles.badgeDisabled
              }
            >
              Currently {charger.enabled ? "enabled" : "disabled"}
            </span>
          </div>

          <dl className={styles.metaGrid}>
            <div>
              <dt>Station</dt>
              <dd>{charger.station && charger.station !== "—" ? charger.station : "—"}</dd>
            </div>
            <div>
              <dt>Online</dt>
              <dd>
                {charger.onlineStatus && charger.onlineStatus !== "—"
                  ? charger.onlineStatus
                  : "—"}
              </dd>
            </div>
            <div className={styles.metaWide}>
              <dt>Address</dt>
              <dd>
                {charger.address && charger.address !== "—"
                  ? charger.address
                  : "—"}
              </dd>
            </div>
            
          </dl>
        </section>

        <section
          className={disabling ? styles.impactDanger : styles.impactSafe}
          aria-label="What will change"
        >
          <h3 className={styles.impactTitle}>What will change</h3>
          <ul className={styles.impactList}>
            {disabling ? (
              <>
                <li>Drivers will not be able to book new sessions with this charger.</li>
                <li>Existing in-progress sessions are not forcibly stopped by this action.</li>
                <li>The charger remains in the system and can be re-enabled at any time.</li>
              </>
            ) : (
              <>
                <li>Drivers will be able to start new sessions on this charger again.</li>
                <li>Availability still depends on online status and connector readiness.</li>
                <li>No configuration or history data is changed by this action.</li>
              </>
            )}
          </ul>

        </section>

        {disabling ? (
          <label className={styles.ack} htmlFor={ackId}>
            <input
              id={ackId}
              type="checkbox"
              checked={acknowledged}
              disabled={loading}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
            <span>
              I understand this charger will be unavailable for new charging
              sessions until enabled again.
            </span>
          </label>
        ) : null}

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
            className={disabling ? styles.destructiveBtn : styles.primaryBtn}
            onClick={onConfirm}
            disabled={loading || !canConfirm}
          >
            {loading
              ? disabling
                ? "Disabling…"
                : "Enabling…"
              : disabling
                ? "Disable charger"
                : "Enable charger"}
          </button>
        </footer>
      </div>
    </div>
  );
}
