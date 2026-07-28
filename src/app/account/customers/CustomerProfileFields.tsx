"use client";

import styles from "../users/adminUsers.module.css";

export type CustomerProfileValues = {
  firstName: string;
  lastName: string;
  displayName: string;
  phone: string;
};

type Props = {
  idPrefix: string;
  loading: boolean;
  values: CustomerProfileValues;
  onChange: (patch: Partial<CustomerProfileValues>) => void;
  displayNamePlaceholder?: string;
  showPhone?: boolean;
};

export default function CustomerProfileFields({
  idPrefix,
  loading,
  values,
  onChange,
  displayNamePlaceholder,
  showPhone = true,
}: Props) {
  return (
    <>
      <div className={styles.formField}>
        <label className={styles.formLabel} htmlFor={`${idPrefix}-first-name`}>
          First name *
        </label>
        <input
          id={`${idPrefix}-first-name`}
          className={styles.formInput}
          value={values.firstName}
          onChange={(e) => onChange({ firstName: e.target.value })}
          disabled={loading}
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel} htmlFor={`${idPrefix}-last-name`}>
          Last name *
        </label>
        <input
          id={`${idPrefix}-last-name`}
          className={styles.formInput}
          value={values.lastName}
          onChange={(e) => onChange({ lastName: e.target.value })}
          disabled={loading}
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel} htmlFor={`${idPrefix}-display-name`}>
          Display name
        </label>
        <input
          id={`${idPrefix}-display-name`}
          className={styles.formInput}
          value={values.displayName}
          onChange={(e) => onChange({ displayName: e.target.value })}
          placeholder={displayNamePlaceholder}
          disabled={loading}
        />
      </div>

      {showPhone && (
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor={`${idPrefix}-phone`}>
            Phone
          </label>
          <input
            id={`${idPrefix}-phone`}
            className={styles.formInput}
            type="tel"
            value={values.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            disabled={loading}
          />
        </div>
      )}
    </>
  );
}
