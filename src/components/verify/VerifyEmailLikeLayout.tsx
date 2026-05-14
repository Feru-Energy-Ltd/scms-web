import type { ReactNode } from "react";
import styles from "@/app/verify/email/page.module.css";

type Props = {
  title: string;
  subtitle: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
};

export default function VerifyEmailLikeLayout({
  title,
  subtitle,
  footer,
  children,
}: Props) {
  return (
    <main className={styles.main}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          {typeof subtitle === "string" ? (
            <p className={styles.subtitle}>{subtitle}</p>
          ) : (
            subtitle
          )}
        </header>
        {children}
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </main>
  );
}
