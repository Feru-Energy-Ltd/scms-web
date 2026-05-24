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

export default function ContactForm({ profile, onUpdated }: Props) {
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [loading, setLoading] = useState(false);

  const hasChanges = phone !== (profile.phone ?? "");

  async function handleSave() {
    setLoading(true);
    try {
      await updateProfile({ phone });
      toast.success("Contact updated");
      onUpdated();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not update contact info." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.formSection}>
      <div className={styles.formField}>
        <label className={styles.formLabel}>
          Email (login username — cannot be changed)
        </label>
        <input
          className={styles.readOnlyInput}
          type="email"
          value={profile.email}
          readOnly
        />
      </div>

      <div className={styles.infoBanner}>
        <span>&#9432;</span>
        <span>Phone verification coming soon. Changes saved without verification.</span>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Phone</label>
        <input
          className={styles.formInput}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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
