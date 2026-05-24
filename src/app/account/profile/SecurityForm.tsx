"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changePassword } from "@/lib/api/profile";
import { clearSession } from "@/lib/auth/session";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import { ApiError } from "@/lib/api/http";
import toast from "react-hot-toast";
import styles from "./profile.module.css";

export default function SecurityForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const mismatch = confirmPassword !== "" && confirmPassword !== newPassword;
  const tooShort = newPassword !== "" && newPassword.length < 8;
  const canSubmit =
    currentPassword !== "" &&
    newPassword.length >= 8 &&
    confirmPassword === newPassword &&
    !loading;

  async function handleChangePassword() {
    setPasswordError("");
    setLoading(true);
    try {
      await changePassword({
        oldPassword: currentPassword,
        newPassword,
      });
      toast.success("Password changed. Please log in again.");
      clearSession();
      router.push("/login");
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 400)) {
        setPasswordError("Current password is incorrect");
      } else {
        showApiErrorToast(e, { fallbackMessage: "Could not change password." });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.formSection}>
      <div className={styles.formField}>
        <label className={styles.formLabel} htmlFor="profile-currentPassword">Current Password</label>
        <input
          id="profile-currentPassword"
          className={styles.formInput}
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            setPasswordError("");
          }}
          disabled={loading}
        />
        {passwordError && (
          <p className={styles.inlineError}>{passwordError}</p>
        )}
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel} htmlFor="profile-newPassword">New Password</label>
        <input
          id="profile-newPassword"
          className={styles.formInput}
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={loading}
        />
        {tooShort && (
          <p className={styles.inlineError}>
            Password must be at least 8 characters
          </p>
        )}
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel} htmlFor="profile-confirmPassword">Confirm New Password</label>
        <input
          id="profile-confirmPassword"
          className={styles.formInput}
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
        />
        {mismatch && (
          <p className={styles.inlineError}>Passwords do not match</p>
        )}
      </div>

      <button
        type="button"
        className={styles.saveBtn}
        onClick={handleChangePassword}
        disabled={!canSubmit}
      >
        {loading ? "Changing..." : "Change Password"}
      </button>
    </div>
  );
}
