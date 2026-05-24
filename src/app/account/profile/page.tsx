"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchProfile, type ProfileResponse } from "@/lib/api/profile";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";
import pStyles from "./profile.module.css";
import BasicInfoForm from "./BasicInfoForm";
import ContactForm from "./ContactForm";
import SecurityForm from "./SecurityForm";

type Tab = "basic" | "contact" | "security";

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>("basic");
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const data = await fetchProfile();
      setProfile(data);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load profile." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  return (
    <div>
      <h1 className={styles.h1}>Profile</h1>

      <div className={pStyles.tabs}>
        <button
          className={tab === "basic" ? pStyles.tabActive : pStyles.tab}
          onClick={() => setTab("basic")}
        >
          Basic Info
        </button>
        <button
          className={tab === "contact" ? pStyles.tabActive : pStyles.tab}
          onClick={() => setTab("contact")}
        >
          Contact
        </button>
        <button
          className={tab === "security" ? pStyles.tabActive : pStyles.tab}
          onClick={() => setTab("security")}
        >
          Security
        </button>
      </div>

      {loading && <p className={styles.muted}>Loading profile...</p>}

      {!loading && !profile && (
        <p className={styles.muted}>Could not load profile.</p>
      )}

      {!loading && profile && tab === "basic" && (
        <BasicInfoForm profile={profile} onUpdated={loadProfile} />
      )}

      {!loading && profile && tab === "contact" && (
        <ContactForm profile={profile} onUpdated={loadProfile} />
      )}

      {!loading && tab === "security" && <SecurityForm />}
    </div>
  );
}
