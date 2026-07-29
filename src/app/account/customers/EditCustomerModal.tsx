"use client";

import { useState } from "react";
import type { Customer, UpdateCustomerRequest } from "@/lib/api/customers";
import FormModal from "@/components/account/FormModal";
import styles from "../users/adminUsers.module.css";
import CustomerProfileFields from "./CustomerProfileFields";

type Props = Readonly<{
  customer: Customer;
  loading: boolean;
  onSave: (data: UpdateCustomerRequest) => void;
  onCancel: () => void;
}>;

export default function EditCustomerModal({ customer, loading, onSave, onCancel }: Props) {
  const [profile, setProfile] = useState({
    firstName: customer.firstName ?? "",
    lastName: customer.lastName ?? "",
    displayName: customer.displayName ?? "",
    phone: customer.phone ?? "",
  });

  function handleSubmit() {
    onSave({
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      phone: profile.phone.trim() || undefined,
      displayName: profile.displayName.trim() || undefined,
    });
  }

  const valid = profile.firstName.trim() && profile.lastName.trim();

  return (
    <FormModal
      title="Edit customer"
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
            {loading ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <div className={styles.formField}>
        <span className={styles.formLabel}>Email</span>
        <p className={styles.readOnlyValue}>{customer.email}</p>
      </div>

      <CustomerProfileFields
        idPrefix="edit-customer"
        loading={loading}
        values={profile}
        onChange={(patch) => setProfile((prev) => ({ ...prev, ...patch }))}
      />
    </FormModal>
  );
}
