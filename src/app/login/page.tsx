 "use client";
import styles from "./login.module.css";

export default function LoginPage() {
  return (
    <main className={styles.main}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true" />
            <span className={styles.brandName}>Safaricharger</span>
          </div>
          <p className={styles.subtitle}>
            Sign in to access the Safaricharger web CMS.
          </p>
        </header>

        <form className={styles.form}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              className={styles.input}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              className={styles.input}
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <div className={styles.actionsRow}>
            <button className={styles.primaryButton} type="submit">
              Sign in
            </button>
            <button className={styles.secondaryButton} type="button">
              Use SSO
            </button>
          </div>
        </form>

        <footer className={styles.footer}>
          <a href="/">Back to homepage</a>
        </footer>
      </div>
    </main>
  );
}

