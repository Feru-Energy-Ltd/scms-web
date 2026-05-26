import styles from "./Skeleton.module.css";

export function SkeletonLine({ width = "100%" }: { width?: string }) {
  return <span className={styles.line} style={{ width }} />;
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className={styles.table} aria-busy="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={styles.row}>
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} />
          ))}
        </div>
      ))}
    </div>
  );
}
