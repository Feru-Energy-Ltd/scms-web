"use client";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "./login/login.module.css";
import { login } from "@/lib/api/auth";
import { establishSessionFromAuthResponse } from "@/lib/auth/establishSession";
import { hasActiveAccessSession } from "@/lib/auth/session";
import {
  buildForgotPasswordPath,
  buildLoginPath,
  resolveNextFromSearch,
  resolvePortalFromSearch,
  type LoginPortal,
} from "@/lib/auth/redirect";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import PasswordEyeIcon from "../components/PasswordEyeIcon";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const portal: LoginPortal =
    searchParams.get("portal") === "admin" ? "admin" : "provider";
  const nextPath = resolveNextFromSearch(search ? `?${search}` : "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (hasActiveAccessSession()) {
      router.replace(resolveNextFromSearch(window.location.search));
      return;
    }
    setShowForm(true);
  }, [router, search]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const activeSearch = window.location.search;
    const activePortal = resolvePortalFromSearch(activeSearch);

    setIsSubmitting(true);
    try {
      const res = await login(email, password, activePortal);
      await establishSessionFromAuthResponse(res);
      toast.success("Signed in successfully");
      router.push(resolveNextFromSearch(activeSearch));
    } catch (err) {
      showApiErrorToast(err, {
        fallbackMessage: "Login failed. Please check your credentials.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showForm) {
    return null;
  }

  const alternatePortalHref =
    portal === "admin"
      ? buildLoginPath(nextPath, "provider")
      : buildLoginPath(nextPath, "admin");
  const forgotHref = buildForgotPasswordPath(portal);

  return (
    <main className={styles.main}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              <Image
                src="/assets/logo.png"
                alt="Safaricharge"
                width={112}
                height={40}
                className={styles.brandLogo}
                priority
              />
            </span>
            <span className={styles.brandName}>Safaricharge</span>
          </div>
          <p className={styles.subtitle}>
            {portal === "admin"
              ? "Sign in to the Safaricharge admin console."
              : "Sign in to access the Safaricharge web CMS."}
          </p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
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
            <div className={styles.passwordWrapper}>
              <input
                className={`${styles.input} ${styles.passwordInput}`}
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className={styles.passwordToggleButton}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((s) => !s)}
              >
                <PasswordEyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          <div className={styles.actionsRow}>
            <button
              className={styles.primaryButton}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

        <footer className={styles.footer}>
          <Link href={forgotHref}>Forgot password</Link>
          {" · "}
          <Link href={alternatePortalHref}>
            {portal === "admin" ? "Provider sign-in" : "Admin sign-in"}
          </Link>
        </footer>
        {portal === "provider" ? (
          <div className={styles.signUpCta}>
            <p className={styles.signUpText}>Are you a service provider?</p>
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={isSubmitting}
              onClick={() => router.push("/sign-up")}
            >
              Sign up
            </button>
          </div>
        ) : null}
        <p className={styles.legalNote}>
          <Link href="/legal/privacy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
