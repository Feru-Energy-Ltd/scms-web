"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import VerifyEmailLikeLayout from "@/components/verify/VerifyEmailLikeLayout";
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
            fallbackMessage:
              "Email verification failed. The link may be invalid or expired.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.kind === "loading") {
    return (
      <VerifyEmailLikeLayout
        title="Verifying your email"
        subtitle={
          <p className={styles.subtitle} role="status">
            Please wait while we confirm your address…
          </p>
        }
      />
    );
  }

  if (state.kind === "missing") {
    return (
      <VerifyEmailLikeLayout
        title="Invalid verification link"
        subtitle="This page needs a valid token from the email we sent you. Open the link from your inbox, or sign up again to receive a new message."
        footer={
          <>
            <Link href="/sign-up">Sign up</Link>
            {" · "}
            <Link href="/login">Sign in</Link>
          </>
        }
      />
    );
  }

  if (state.kind === "error") {
    return (
      <VerifyEmailLikeLayout
        title="Verification failed"
        subtitle="We could not verify your email with this link. It may have expired or already been used. Try requesting a new email from support or complete sign up again."
        footer={<Link href="/">Ok</Link>}
      />
    );
  }

  return (
    <VerifyEmailLikeLayout
      title="Please wait for approval"
      subtitle={<p className={styles.subtitle}>{state.message}</p>}
      footer={<Link href="/">Ok</Link>}
    />
  );
}

export default function VerifyProviderEmailPage() {
  return (
    <Suspense
      fallback={
        <VerifyEmailLikeLayout
          title="Verifying your email"
          subtitle={<p className={styles.subtitle}>Loading…</p>}
        />
      }
    >
      <VerifyProviderEmailContent />
    </Suspense>
  );
}
