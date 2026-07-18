import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import styles from "./KpiCard.module.css";

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  delta?: string;
  deltaDir?: "up" | "down";
  accent?: boolean;
  href?: string;
}

export default function KpiCard({
  label,
  value,
  subtitle,
  icon: Icon,
  delta,
  deltaDir = "up",
  accent,
  href,
}: KpiCardProps) {
  const content = (
    <>
      {(Icon || delta) && (
        <div className={styles.top}>
          {Icon ? (
            <div className={styles.iconChip}>
              <Icon size={20} strokeWidth={2} />
            </div>
          ) : (
            <span />
          )}
          {delta && (
            <span
              className={`${styles.delta} ${
                deltaDir === "down" ? styles.deltaDown : styles.deltaUp
              }`}
            >
              {deltaDir === "down" ? "↓" : "↑"} {delta}
            </span>
          )}
        </div>
      )}
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
      {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
    </>
  );

  const className = `${styles.card} ${accent ? styles.accent : ""} ${
    href ? styles.linkCard : ""
  }`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
