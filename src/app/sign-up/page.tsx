"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { signup } from "@/app/actions/signup";
import PasswordEyeIcon from "../login/PasswordEyeIcon";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "./sign-up.module.css";

type FieldErrors = Record<string, string[] | undefined>;

export default function SignUpPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const result = await signup(new FormData(e.currentTarget));

      if (result.ok === false) {
        if ("fieldErrors" in result) {
          setFieldErrors(result.fieldErrors ?? {});
          toast.error("Please correct the highlighted fields.");
          return;
        }
        showApiErrorToast(
          result,          { fallbackMessage: "Sign up failed. Please try again." },
        );
        return;
      }

      toast.success("Check your email for verification code to continue");
      router.push("/verify/email");
    } catch (err) {
      showApiErrorToast(err, {
        fallbackMessage: "Sign up failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>
            Register your business and start using Safaricharge CMS.
          </p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          {fieldErrors._form?.[0] ? (
            <p className={styles.fieldError} role="alert">
              {fieldErrors._form[0]}
            </p>
          ) : null}

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="displayName">
              Full name
            </label>
            <input
              className={styles.input}
              id="displayName"
              type="text"
              name="displayName"
              autoComplete="name"
              required
            />
            {fieldErrors.displayName?.[0] ? (
              <p className={styles.fieldError}>{fieldErrors.displayName[0]}</p>
            ) : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="ownerEmail">
              Email
            </label>
            <input
              className={styles.input}
              id="ownerEmail"
              type="email"
              name="ownerEmail"
              autoComplete="email"
              required
            />
            {fieldErrors.ownerEmail?.[0] ? (
              <p className={styles.fieldError}>{fieldErrors.ownerEmail[0]}</p>
            ) : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="ownerPassword">
              Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                className={`${styles.input} ${styles.passwordInput}`}
                id="ownerPassword"
                type={showPassword ? "text" : "password"}
                name="ownerPassword"
                autoComplete="new-password"
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
            {fieldErrors.ownerPassword?.[0] ? (
              <p className={styles.fieldError}>{fieldErrors.ownerPassword[0]}</p>
            ) : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="businessName">
              Business name
            </label>
            <input
              className={styles.input}
              id="businessName"
              type="text"
              name="businessName"
              required
            />
            {fieldErrors.businessName?.[0] ? (
              <p className={styles.fieldError}>{fieldErrors.businessName[0]}</p>
            ) : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="registration">
              Business registration number
            </label>
            <input
              className={styles.input}
              id="registration"
              type="text"
              name="registration"
              autoComplete="off"
              required
              placeholder="e.g. company or tax registration ID"
            />
            {fieldErrors.registration?.[0] ? (
              <p className={styles.fieldError}>{fieldErrors.registration[0]}</p>
            ) : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="phone">
              Phone number
            </label>
            <input
              className={styles.input}
              id="phone"
              type="tel"
              name="phone"
              autoComplete="tel"
              required
            />
            {fieldErrors.phone?.[0] ? (
              <p className={styles.fieldError}>{fieldErrors.phone[0]}</p>
            ) : null}
          </div>

          <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <footer className={styles.footer}>
          Already have an account? <Link href="/login">Sign in</Link>
        </footer>
      </div>
    </main>
  );
}
