"use client";

import {
  Suspense,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import VerifyEmailLikeLayout from "@/components/verify/VerifyEmailLikeLayout";
import {
  acceptAccountInvitation,
  acceptProviderInvitation,
} from "@/lib/api/auth";
import { hasActiveAccessSession } from "@/lib/auth/session";
import {
  persistPhase1Session,
  Phase1SessionIncompleteError,
} from "@/lib/auth/persistPhase1Session";
import { decodeInvitationTokenMeta } from "@/lib/invitation/decodeInvitationTokenMeta";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import PasswordEyeIcon from "../login/PasswordEyeIcon";
import loginStyles from "../login/login.module.css";
import verifyStyles from "../verify/email/page.module.css";
import listStyles from "@/components/account/ResourceList.module.css";

function InviteAcceptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [gate, setGate] = useState<"pending" | "ready">("pending");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    if (hasActiveAccessSession()) {
      router.replace("/account");
      return;
    }
    setGate("ready");
  }, [router]);

  const meta = token ? decodeInvitationTokenMeta(token) : null;

  if (gate === "pending") {
    return null;
  }

  if (!token) {
    return (
      <VerifyEmailLikeLayout
        title="Invalid invitation link"
        subtitle="This page needs a valid invitation token from your email. Open the full link from your message, or ask your administrator to resend the invitation."
        footer={
          <>
            <Link href="/login">Sign in</Link>
            {" · "}
            <Link href="/">Home</Link>
          </>
        }
      />
    );
  }

  if (!meta) {
    return (
      <VerifyEmailLikeLayout
        title="Invalid or expired invitation"
        subtitle="We could not read this invitation link. It may be corrupted, expired, or not meant for this page."
        footer={<Link href="/login">Sign in</Link>}
      />
    );
  }

  const scopeLabel =
    meta.scope === "PROVIDER_STAFF"
      ? "service provider team"
      : "customer account";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setAcceptError(null);
    setSubmitting(true);
    try {
      const body = {
        token,
        password: password.trim() || undefined,
        displayName: displayName.trim() || undefined,
      };
      const res =
        meta.scope === "PROVIDER_STAFF"
          ? await acceptProviderInvitation(body)
          : await acceptAccountInvitation(body);

      await persistPhase1Session(res);
      toast.success("Invitation accepted. You're signed in.");
      router.push("/account");
    } catch (err) {
      if (err instanceof Phase1SessionIncompleteError) {
        toast.error(err.message);
      } else {
        showApiErrorToast(err, {
          fallbackMessage: "Could not accept this invitation.",
        });
        setAcceptError(
          "Something went wrong. Check your password if this is a new account, or try signing in if you already have one.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <VerifyEmailLikeLayout
      title="Accept invitation"
      subtitle={
        <p className={verifyStyles.subtitle}>
          You&apos;ve been invited to join a {scopeLabel} as{" "}
          <strong>{meta.inviteeEmail}</strong>. If you are new to Safaricharge,
          choose a password (and optional display name). If you already have an
          account with this email, leave the password blank.
        </p>
      }
      footer={
        <>
          Wrong person? <Link href="/login">Sign in</Link> with another account.
        </>
      }
    >
      <form className={loginStyles.form} onSubmit={onSubmit}>
        <div className={loginStyles.fieldGroup}>
          <label className={loginStyles.label} htmlFor="invite-display">
            Display name <span className={listStyles.muted}>(optional)</span>
          </label>
          <input
            className={loginStyles.input}
            id="invite-display"
            name="displayName"
            type="text"
            autoComplete="name"
            placeholder="How your name appears"
            value={displayName}
            onChange={(ev) => setDisplayName(ev.target.value)}
          />
        </div>

        <div className={loginStyles.fieldGroup}>
          <label className={loginStyles.label} htmlFor="invite-password">
            Password <span className={listStyles.muted}>(new accounts)</span>
          </label>
          <div className={loginStyles.passwordWrapper}>
            <input
              className={`${loginStyles.input} ${loginStyles.passwordInput}`}
              id="invite-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Required if you do not already have an account"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
            />
            <button
              type="button"
              className={loginStyles.passwordToggleButton}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((s) => !s)}
            >
              <PasswordEyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        {acceptError ? (
          <p className={listStyles.error} role="alert">
            {acceptError}
          </p>
        ) : null}

        <div className={loginStyles.actionsRow}>
          <button
            className={loginStyles.primaryButton}
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Accepting…" : "Accept invitation"}
          </button>
        </div>
      </form>
    </VerifyEmailLikeLayout>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <VerifyEmailLikeLayout
          title="Invitation"
          subtitle={<p className={verifyStyles.subtitle}>Loading…</p>}
        />
      }
    >
      <InviteAcceptContent />
    </Suspense>
  );
}
