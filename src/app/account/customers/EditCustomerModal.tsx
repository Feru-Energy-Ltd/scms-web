"use client";

import { useState } from "react";
import type { Customer, UpdateCustomerRequest } from "@/lib/api/customers";
import styles from "../users/adminUsers.module.css";

interface Props {
  customer: Customer;
  loading: boolean;
  onSave: (data: UpdateCustomerRequest) => void;
  onCancel: () => void;
}

export default function EditCustomerModal({ customer, loading, onSave, onCancel }: Props) {
  const [firstName, setFirstName] = useState(customer.firstName ?? "");
  const [lastName, setLastName] = useState(customer.lastName ?? "");
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [displayName, setDisplayName] = useState(customer.displayName ?? "");

  function handleSubmit() {
    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
      displayName: displayName.trim() || undefined,
    });
  }

  const valid = firstName.trim() && lastName.trim();

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Edit customer</h2>

        <div className={styles.formField}>
          <span className={styles.formLabel}>Email</span>
          <p className={styles.readOnlyValue}>{customer.email}</p>
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="edit-customer-first-name">
            First name *
          </label>
          <input
            id="edit-customer-first-name"
            className={styles.formInput}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="edit-customer-last-name">
            Last name *
          </label>
          <input
            id="edit-customer-last-name"
            className={styles.formInput}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="edit-customer-display-name">
            Display name
          </label>
          <input
            id="edit-customer-display-name"
            className={styles.formInput}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="edit-customer-phone">
            Phone
          </label>
          <input
            id="edit-customer-phone"
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
            {loading ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
