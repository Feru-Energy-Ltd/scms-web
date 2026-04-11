"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyProviderEmail } from "@/lib/api/auth";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "../verify/email/page.module.css";

type VerifyState =
  | { kind: "loading" }
  | { kind: "success"; message: string }
  | { kind: "error" }
  | { kind: "missing" };

function VerifyProviderEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [state, setState] = useState<VerifyState>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "missing" });
      return;
    }

    let cancelled = false;
    setState({ kind: "loading" });

    verifyProviderEmail(token)
      .then((res) => {
        if (!cancelled) {
          setState({ kind: "success", message: res.message });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ kind: "error" });
          showApiErrorToast(err, {
            fallbackMessage: "Email verification failed. The link may be invalid or expired.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.kind === "loading") {
    return (
      <main className={styles.main}>
        <div className={styles.shell}>
          <header className={styles.header}>
            <h1 className={styles.title}>Verifying your email</h1>
            <p className={styles.subtitle} role="status">
              Please wait while we confirm your address…
            </p>
          </header>
        </div>
      </main>
    );
  }

  if (state.kind === "missing") {
    return (
      <main className={styles.main}>
        <div className={styles.shell}>
          <header className={styles.header}>
            <h1 className={styles.title}>Invalid verification link</h1>
            <p className={styles.subtitle}>
              This page needs a valid token from the email we sent you. Open the link from
              your inbox, or sign up again to receive a new message.
            </p>
          </header>
          <footer className={styles.footer}>
            <Link href="/sign-up">Sign up</Link>
            {" · "}
            <Link href="/login">Sign in</Link>
          </footer>
        </div>
      </main>
    );
  }

  if (state.kind === "error") {
    return (
      <main className={styles.main}>
        <div className={styles.shell}>
          <header className={styles.header}>
            <h1 className={styles.title}>Verification failed</h1>
            <p className={styles.subtitle}>
              We could not verify your email with this link. It may have expired or already
              been used. Try requesting a new email from support or complete sign up again.
            </p>
          </header>
          <footer className={styles.footer}>
            <Link href="/sign-up">Sign up</Link>
            {" · "}
            <Link href="/login">Sign in</Link>
          </footer>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <h1 className={styles.title}>Email verified</h1>
          <p className={styles.subtitle}>{state.message}</p>
        </header>
        <footer className={styles.footer}>
          <Link href="/login">Sign in</Link>
        </footer>
      </div>
    </main>
  );
}

export default function VerifyProviderEmailPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.main}>
          <div className={styles.shell}>
            <header className={styles.header}>
              <h1 className={styles.title}>Verifying your email</h1>
              <p className={styles.subtitle}>Loading…</p>
            </header>
          </div>
        </main>
      }
    >
      <VerifyProviderEmailContent />
    </Suspense>
  );
}
