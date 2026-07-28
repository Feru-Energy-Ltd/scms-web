"use client";

import type {
  CustomerAccountStatus,
  CustomerAccountType,
} from "@/lib/api/customers";
import modalStyles from "../users/adminUsers.module.css";

const ACCOUNT_TYPES: CustomerAccountType[] = ["PERSONAL", "TEAM", "ENTERPRISE"];
const ACCOUNT_STATUSES: CustomerAccountStatus[] = ["ACTIVE", "SUSPENDED", "DEACTIVATED"];

export type CustomerAccountFormValues = {
  name: string;
  accountType: CustomerAccountType;
  status: CustomerAccountStatus;
  businessName: string;
  maxMembers: string;
};

type Props = {
  idPrefix: string;
  loading: boolean;
  values: CustomerAccountFormValues;
  onChange: (patch: Partial<CustomerAccountFormValues>) => void;
  showType?: boolean;
  showStatus?: boolean;
};

export default function CustomerAccountFields({
  idPrefix,
  loading,
  values,
  onChange,
  showType,
  showStatus,
}: Props) {
  return (
    <>
      <div className={modalStyles.formField}>
        <label className={modalStyles.formLabel} htmlFor={`${idPrefix}-name`}>
          Name *
        </label>
        <input
          id={`${idPrefix}-name`}
          className={modalStyles.formInput}
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          disabled={loading}
        />
      </div>

      {showType && (
        <div className={modalStyles.formField}>
          <label className={modalStyles.formLabel} htmlFor={`${idPrefix}-type`}>
            Type *
          </label>
          <select
            id={`${idPrefix}-type`}
            className={modalStyles.formSelect}
            value={values.accountType}
            onChange={(e) =>
              onChange({ accountType: e.target.value as CustomerAccountType })
            }
            disabled={loading}
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}

      {showStatus && (
        <div className={modalStyles.formField}>
          <label className={modalStyles.formLabel} htmlFor={`${idPrefix}-status`}>
            Status
          </label>
          <select
            id={`${idPrefix}-status`}
            className={modalStyles.formSelect}
            value={values.status}
            onChange={(e) =>
              onChange({ status: e.target.value as CustomerAccountStatus })
            }
            disabled={loading}
          >
            {ACCOUNT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={modalStyles.formField}>
        <label className={modalStyles.formLabel} htmlFor={`${idPrefix}-business`}>
          Business name
        </label>
        <input
          id={`${idPrefix}-business`}
          className={modalStyles.formInput}
          value={values.businessName}
          onChange={(e) => onChange({ businessName: e.target.value })}
          disabled={loading}
        />
      </div>

      <div className={modalStyles.formField}>
        <label className={modalStyles.formLabel} htmlFor={`${idPrefix}-max`}>
          Max members
        </label>
        <input
          id={`${idPrefix}-max`}
          className={modalStyles.formInput}
          type="number"
          min={1}
          value={values.maxMembers}
          onChange={(e) => onChange({ maxMembers: e.target.value })}
          disabled={loading}
        />
      </div>
    </>
  );
}
