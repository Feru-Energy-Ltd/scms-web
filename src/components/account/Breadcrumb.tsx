"use client";

import Link from "next/link";
import styles from "./Breadcrumb.module.css";

export type Crumb = { label: string; href?: string };

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className={styles.nav} aria-label="Breadcrumb">
      {items.map((c, i) => (
        <span key={c.href ?? c.label} className={styles.item}>
          {c.href ? (
            <Link href={c.href} className={styles.link}>
              {c.label}
            </Link>
          ) : (
            <span aria-current="page">{c.label}</span>
          )}
          {i < items.length - 1 && <span className={styles.sep}>/</span>}
        </span>
      ))}
    </nav>
  );
}
