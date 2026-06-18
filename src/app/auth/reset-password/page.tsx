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
import PasswordEyeIcon from "@/components/PasswordEyeIcon";
import {
  completePasswordReset,
  requestPasswordReset,
} from "@/lib/api/auth";
import { hasActiveAccessSession } from "@/lib/auth/session";
import {
  getApiErrorMessage,
  showApiErrorToast,
} from "@/lib/toast/showApiErrorToast";
import loginStyles from "@/app/login/login.module.css";
import verifyStyles from "@/app/verify/email/page.module.css";
import listStyles from "@/components/account/ResourceList.module.css";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const trimmed = email.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      await requestPasswordReset(trimmed);
    } catch {
      // Always show the same success state to avoid email enumeration.
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <VerifyEmailLikeLayout
        title="Check your email"
        subtitle={
          <p className={verifyStyles.subtitle}>
            If an account exists for <strong>{email.trim()}</strong>, we sent a
            password reset link. The link expires after a short time.
          </p>
        }
        footer={
          <>
            Didn&apos;t get it? Check spam or{" "}
            <button
              type="button"
              className={verifyStyles.footerAction}
              onClick={() => setSent(false)}
            >
              try again
            </button>
            {" · "}
            <Link href="/">Sign in</Link>
          </>
        }
      >
        <ul className={verifyStyles.body}>
          <li>Open the link from the email on this device.</li>
          <li>You can close this tab after you reset your password.</li>
        </ul>
      </VerifyEmailLikeLayout>
    );
  }

  return (
    <VerifyEmailLikeLayout
      title="Forgot password"
      subtitle="Enter the email for your Safaricharge account. We will send a reset link if it is registered."
      footer={
        <>
          Remember your password? <Link href="/">Sign in</Link>
        </>
      }
    >
      <form className={loginStyles.form} onSubmit={onSubmit}>
        <div className={loginStyles.fieldGroup}>
          <label className={loginStyles.label} htmlFor="reset-email">
            Email
          </label>
          <input
            className={loginStyles.input}
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
          />
        </div>

        <div className={loginStyles.actionsRow}>
          <button
            className={loginStyles.primaryButton}
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Sending…" : "Send reset link"}
          </button>
        </div>
      </form>
    </VerifyEmailLikeLayout>
  );
}

function ResetPasswordForm({ token }: { token: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const tooShort = password !== "" && password.length < 8;
  const mismatch =
    confirmPassword !== "" && confirmPassword !== password;
  const canSubmit =
    password.length >= 8 &&
    confirmPassword === password &&
    !submitting;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setFormError(null);
    setSubmitting(true);
    try {
      await completePasswordReset(token, password);
      toast.success("Password updated. You can sign in now.");
      setDone(true);
    } catch (err) {
      showApiErrorToast(err, {
        fallbackMessage: "Could not reset your password.",
      });
      setFormError(
        getApiErrorMessage(err, {
          fallbackMessage:
            "This reset link is invalid, expired, or already used. Request a new link from the sign-in page.",
        }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <VerifyEmailLikeLayout
        title="Password updated"
        subtitle="Your password has been changed. Sign in with your new password to continue."
        footer={<Link href="/">Sign in</Link>}
      />
    );
  }

  return (
    <VerifyEmailLikeLayout
      title="Set new password"
      subtitle="Choose a new password for your Safaricharge account."
      footer={
        <>
          Link not working?{" "}
          <Link href="/auth/reset-password">Request a new reset link</Link>
        </>
      }
    >
      <form className={loginStyles.form} onSubmit={onSubmit}>
        <div className={loginStyles.fieldGroup}>
          <label className={loginStyles.label} htmlFor="reset-password">
            New password
          </label>
          <div className={loginStyles.passwordWrapper}>
            <input
              className={`${loginStyles.input} ${loginStyles.passwordInput}`}
              id="reset-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
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
          {tooShort ? (
            <p className={listStyles.error}>Password must be at least 8 characters.</p>
          ) : null}
        </div>

        <div className={loginStyles.fieldGroup}>
          <label className={loginStyles.label} htmlFor="reset-confirm">
            Confirm new password
          </label>
          <div className={loginStyles.passwordWrapper}>
            <input
              className={`${loginStyles.input} ${loginStyles.passwordInput}`}
              id="reset-confirm"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(ev) => setConfirmPassword(ev.target.value)}
            />
            <button
              type="button"
              className={loginStyles.passwordToggleButton}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              aria-pressed={showConfirm}
              onClick={() => setShowConfirm((s) => !s)}
            >
              <PasswordEyeIcon open={showConfirm} />
            </button>
          </div>
          {mismatch ? (
            <p className={listStyles.error}>Passwords do not match.</p>
          ) : null}
        </div>

        {formError ? (
          <p className={listStyles.error} role="alert">
            {formError}
          </p>
        ) : null}

        <div className={loginStyles.actionsRow}>
          <button
            className={loginStyles.primaryButton}
            type="submit"
            disabled={!canSubmit}
          >
            {submitting ? "Saving…" : "Update password"}
          </button>
        </div>
      </form>
    </VerifyEmailLikeLayout>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [gate, setGate] = useState<"pending" | "ready">("pending");

  useEffect(() => {
    if (!token && hasActiveAccessSession()) {
      router.replace("/account");
      return;
    }
    setGate("ready");
  }, [router, token]);

  if (gate === "pending") {
    return null;
  }

  if (token) {
    return <ResetPasswordForm token={token} />;
  }

  return <ForgotPasswordForm />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <VerifyEmailLikeLayout
          title="Password reset"
          subtitle={<p className={verifyStyles.subtitle}>Loading…</p>}
        />
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
