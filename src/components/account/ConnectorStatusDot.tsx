import styles from "./ConnectorStatusDot.module.css";

export type ConnectorStatus = "AVAILABLE" | "OCCUPIED" | "OFFLINE" | "FAULTED";

const CLASS: Record<ConnectorStatus, string> = {
  AVAILABLE: styles.available,
  OCCUPIED: styles.occupied,
  OFFLINE: styles.offline,
  FAULTED: styles.faulted,
};

export default function ConnectorStatusDot({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  const upper = (status ?? "").toUpperCase();
  const key: ConnectorStatus = upper in CLASS ? (upper as ConnectorStatus) : "OFFLINE";
  return (
    <span className={styles.wrap}>
      <span className={`${styles.dot} ${CLASS[key]}`} aria-hidden="true" />
      <span>{label ?? status}</span>
    </span>
  );
}
