"use client";

import { useState } from "react";
import type { CreateCustomerRequest } from "@/lib/api/customers";
import styles from "../users/adminUsers.module.css";

interface Props {
  loading: boolean;
  onSave: (data: CreateCustomerRequest) => void;
  onCancel: () => void;
}

export default function CreateCustomerModal({ loading, onSave, onCancel }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");

  function handleSubmit() {
    onSave({
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
      displayName: displayName.trim() || undefined,
    });
  }

  const valid =
    email.trim() &&
    password.length >= 8 &&
    firstName.trim() &&
    lastName.trim();

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Create customer</h2>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="customer-first-name">
            First name *
          </label>
          <input
            id="customer-first-name"
            className={styles.formInput}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="customer-last-name">
            Last name *
          </label>
          <input
            id="customer-last-name"
            className={styles.formInput}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="customer-display-name">
            Display name
          </label>
          <input
            id="customer-display-name"
            className={styles.formInput}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Optional"
            disabled={loading}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="customer-email">
            Email *
          </label>
          <input
            id="customer-email"
            className={styles.formInput}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="customer-password">
            Password *
          </label>
          <input
            id="customer-password"
            className={styles.formInput}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            minLength={8}
            disabled={loading}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="customer-phone">
            Phone
          </label>
          <input
            id="customer-phone"
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
            {loading ? "Creating…" : "Create customer"}
          </button>
        </div>
      </div>
    </div>
  );
}
