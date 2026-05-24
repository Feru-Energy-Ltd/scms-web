"use client";

import { useState } from "react";
import { updateProfile, type ProfileResponse } from "@/lib/api/profile";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import toast from "react-hot-toast";
import styles from "./profile.module.css";

interface Props {
  profile: ProfileResponse;
  onUpdated: () => void;
}

export default function BasicInfoForm({ profile, onUpdated }: Props) {
  const [firstName, setFirstName] = useState(profile.firstName ?? "");
  const [lastName, setLastName] = useState(profile.lastName ?? "");
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [loading, setLoading] = useState(false);

  const hasChanges =
    firstName !== (profile.firstName ?? "") ||
    lastName !== (profile.lastName ?? "") ||
    displayName !== (profile.displayName ?? "");

  async function handleSave() {
    setLoading(true);
    try {
      await updateProfile({ firstName, lastName, displayName });
      toast.success("Profile updated");
      onUpdated();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not update profile." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.formSection}>
      <div className={styles.formField}>
        <label className={styles.formLabel}>First Name</label>
        <input
          className={styles.formInput}
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Last Name</label>
        <input
          className={styles.formInput}
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Display Name</label>
        <input
          className={styles.formInput}
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={loading}
        />
      </div>

      <button
        className={styles.saveBtn}
        onClick={handleSave}
        disabled={!hasChanges || loading}
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
