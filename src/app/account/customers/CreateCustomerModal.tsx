"use client";

import { useState } from "react";
import type { CreateCustomerRequest } from "@/lib/api/customers";
import FormModal from "@/components/account/FormModal";
import styles from "../users/adminUsers.module.css";
import CustomerProfileFields from "./CustomerProfileFields";

type Props = Readonly<{
  loading: boolean;
  onSave: (data: CreateCustomerRequest) => void;
  onCancel: () => void;
}>;

export default function CreateCustomerModal({ loading, onSave, onCancel }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    phone: "",
  });

  function handleSubmit() {
    onSave({
      email: email.trim(),
      password,
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      phone: profile.phone.trim() || undefined,
      displayName: profile.displayName.trim() || undefined,
    });
  }

  const valid =
    email.trim() &&
    password.length >= 8 &&
    profile.firstName.trim() &&
    profile.lastName.trim();

  return (
    <FormModal
      title="Create customer"
      loading={loading}
      onClose={onCancel}
      actions={
        <>
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
        </>
      }
    >
      <CustomerProfileFields
        idPrefix="customer"
        loading={loading}
        values={profile}
        onChange={(patch) => setProfile((prev) => ({ ...prev, ...patch }))}
        displayNamePlaceholder="Optional"
        showPhone={false}
      />

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
          value={profile.phone}
          onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
          disabled={loading}
        />
      </div>
    </FormModal>
  );
}
