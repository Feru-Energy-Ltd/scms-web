"use client";

import { useState } from "react";
import type { CreateServiceProviderRequest } from "@/lib/api/serviceProviders";
import styles from "./createProvider.module.css";

interface Props {
  loading: boolean;
  onSave: (data: CreateServiceProviderRequest) => void;
  onCancel: () => void;
}

export default function CreateProviderModal({ loading, onSave, onCancel }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [registration, setRegistration] = useState("");
  const [phone, setPhone] = useState("");

  function handleSubmit() {
    onSave({
      displayName: displayName.trim(),
      ownerEmail: ownerEmail.trim(),
      ownerPassword,
      businessName: businessName.trim(),
      registration: registration.trim(),
      phone: phone.trim() || undefined,
    });
  }

  const valid =
    displayName.trim() &&
    ownerEmail.trim() &&
    ownerPassword.length >= 8 &&
    businessName.trim() &&
    registration.trim();

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Create service provider</h2>
        <p className={styles.modalHint}>
          The provider starts as pending and must be approved before they can sign in.
        </p>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="provider-owner-name">
            Owner name *
          </label>
          <input
            id="provider-owner-name"
            className={styles.formInput}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="provider-owner-email">
            Owner email *
          </label>
          <input
            id="provider-owner-email"
            className={styles.formInput}
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="provider-owner-password">
            Owner password *
          </label>
          <input
            id="provider-owner-password"
            className={styles.formInput}
            type="password"
            value={ownerPassword}
            onChange={(e) => setOwnerPassword(e.target.value)}
            minLength={8}
            disabled={loading}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="provider-business-name">
            Business name *
          </label>
          <input
            id="provider-business-name"
            className={styles.formInput}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="provider-registration">
            Registration number *
          </label>
          <input
            id="provider-registration"
            className={styles.formInput}
            value={registration}
            onChange={(e) => setRegistration(e.target.value)}
            placeholder="Company or tax registration ID"
            disabled={loading}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="provider-phone">
            Phone
          </label>
          <input
            id="provider-phone"
            className={styles.formInput}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleSubmit}
            disabled={loading || !valid}
          >
            {loading ? "Creating…" : "Create provider"}
          </button>
        </div>
      </div>
    </div>
  );
}
