import styles from "./KpiCard.module.css";

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
}

export default function KpiCard({ label, value, subtitle }: KpiCardProps) {
  return (
    <div className={styles.card}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
    </div>
  );
}
