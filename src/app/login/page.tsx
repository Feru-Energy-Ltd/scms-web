"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "./login.module.css";
import { login, selectContext } from "@/lib/api/auth";
import {
  setIdentityTypeAndRole,
  setSessionFromPhase1,
  setSessionFromTokenResponse,
} from "@/lib/auth/session";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import PasswordEyeIcon from "./PasswordEyeIcon";
import { decodeJwtPayload } from "@/lib/auth/jwt";

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setIsSubmitting(true);
    try {
      const res = await login(email, password);

      let redirectRole = "user";
      const identityType = res.identityType;

      if (identityType === "SERVICE_PROVIDER") {
        redirectRole = res.provider?.role ?? "provider";
        setSessionFromPhase1(res);
        setIdentityTypeAndRole(identityType, redirectRole);
      } else if (identityType === "SYSTEM_ADMIN") {
        setSessionFromPhase1(res);

        const payload = res.accessToken
          ? decodeJwtPayload(res.accessToken)
          : null;
        const roleClaim =
          typeof payload?.role === "string"
            ? payload.role
            : Array.isArray(payload?.roles) && payload.roles.length > 0
              ? String(payload.roles[0])
              : null;

        redirectRole = roleClaim ?? "system-admin";
        setIdentityTypeAndRole(identityType, redirectRole);
      } else if (identityType === "CUSTOMER") {
        // Customer accounts require Phase 2 (context selection) to get access/refresh tokens.
        const firstAccount = res.accounts?.[0];
        redirectRole = firstAccount?.role ?? "customer";

        if (res.autoSelect && firstAccount) {
          if (!res.identityToken) {
            toast.error(
              "Login requires account context, but identity token was not returned.",
            );
            return;
          }
          const tokenRes = await selectContext(
            res.identityToken,
            firstAccount.accountId,
          );
          setSessionFromTokenResponse(tokenRes);
          redirectRole = tokenRes.account?.role ?? redirectRole;
        } else {
          // At least store identity information for later context selection.
          setSessionFromPhase1(res);
        }

        setIdentityTypeAndRole(identityType, redirectRole);
      } else {
        setSessionFromPhase1(res);
      }

      toast.success("Signed in successfully");
      router.push(`/role/${encodeURIComponent(redirectRole)}`);
    } catch (err) {
      showApiErrorToast(err, {
        fallbackMessage: "Login failed. Please check your credentials.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              <Image
                src="/assets/logo.png"
                alt="Safaricharger"
                width={112}
                height={40}
                className={styles.brandLogo}
                priority
              />
            </span>
            <span className={styles.brandName}>Safaricharger</span>
          </div>
          <p className={styles.subtitle}>
            Sign in to access the Safaricharger web CMS.
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
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={isSubmitting}
              onClick={() => toast.error("SSO flow is not implemented yet.")}
            >
              Use SSO
            </button>
          </div>
        </form>

        <footer className={styles.footer}>
          <Link href="/">Back to homepage</Link>
        </footer>
      </div>
    </main>
  );
}

