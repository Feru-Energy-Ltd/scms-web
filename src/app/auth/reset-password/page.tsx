"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import VerifyEmailLikeLayout from "@/components/verify/VerifyEmailLikeLayout";
import { apiRequest } from "@/lib/api/http";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import PasswordEyeIcon from "../../../components/PasswordEyeIcon";
import loginStyles from "../../login/login.module.css";
import verifyStyles from "../../verify/email/page.module.css";
import listStyles from "@/components/account/ResourceList.module.css";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <VerifyEmailLikeLayout
        title="Invalid reset link"
        subtitle="This page needs a valid password reset token from your email. Open the full link from your message, or request a new reset."
        footer={<Link href="/">Sign in</Link>}
      />
    );
  }

  if (done) {
    return (
      <VerifyEmailLikeLayout
        title="Password reset"
        subtitle="Your password has been reset successfully. You can now sign in with your new password."
        footer={<Link href="/">Sign in</Link>}
      />
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest("/auth/password/reset", {
        method: "POST",
        body: { token, newPassword },
      });
      toast.success("Password reset successfully.");
      setDone(true);
    } catch (err) {
      showApiErrorToast(err, {
        fallbackMessage: "Could not reset password. The link may have expired.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <VerifyEmailLikeLayout
      title="Reset your password"
      subtitle={
        <p className={verifyStyles.subtitle}>
          Enter your new password below.
        </p>
      }
      footer={
        <>
          Remembered it? <Link href="/">Sign in</Link>
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
              name="newPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(ev) => setNewPassword(ev.target.value)}
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

        <div className={loginStyles.fieldGroup}>
          <label className={loginStyles.label} htmlFor="reset-confirm">
            Confirm password
          </label>
          <input
            className={loginStyles.input}
            id="reset-confirm"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(ev) => setConfirmPassword(ev.target.value)}
          />
        </div>

        {error ? (
          <p className={listStyles.error} role="alert">
            {error}
          </p>
        ) : null}

        <div className={loginStyles.actionsRow}>
          <button
            className={loginStyles.primaryButton}
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Resetting…" : "Reset password"}
          </button>
        </div>
      </form>
    </VerifyEmailLikeLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <VerifyEmailLikeLayout
          title="Reset password"
          subtitle={<p className={verifyStyles.subtitle}>Loading…</p>}
        />
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
