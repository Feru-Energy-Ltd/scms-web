import Link from "next/link";
import styles from "./page.module.css";

export default function EmailVerificationPage() {
  return (
    <main className={styles.main}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <h1 className={styles.title}>Check your email</h1>
          <p className={styles.subtitle}>
            We sent a verification link to the address you used during Signup. Open it to
            activate your account and continue to Safaricharge CMS.
          </p>
        </header>

        <ul className={styles.body}>
          <li>The message may take a minute to arrive.</li>
          <li>If you do not see it, look in spam or promotions.</li>
          <li>You can close this tab after you have verified.</li>
        </ul>

        <footer className={styles.footer}>
          Wrong email? <Link href="/sign-up">Go back to sign up</Link>
          {" · "}
          <Link href="/login">Sign in</Link>
        </footer>
      </div>
    </main>
  );
}
