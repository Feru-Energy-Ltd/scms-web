"use client";

import { useId, useMemo, useState } from "react";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  countryFlag,
  type CountryOption,
} from "@/lib/phone/countries";
import { formatE164Phone } from "@/lib/phone/format";
import styles from "./PhoneField.module.css";

type Props = {
  name?: string;
  id?: string;
  label?: string;
  labelClassName?: string;
  required?: boolean;
  autoComplete?: string;
  defaultCountryIso2?: string;
  error?: string;
  errorClassName?: string;
};

export default function PhoneField({
  name = "phone",
  id,
  label = "Phone number",
  labelClassName,
  required = false,
  autoComplete = "tel",
  defaultCountryIso2 = DEFAULT_COUNTRY.iso2,
  error,
  errorClassName,
}: Props) {
  const generatedId = useId();
  const localInputId = id ?? generatedId;
  const countrySelectId = `${localInputId}-country`;

  const initialCountry =
    COUNTRIES.find((c) => c.iso2 === defaultCountryIso2) ?? DEFAULT_COUNTRY;

  const [country, setCountry] = useState<CountryOption>(initialCountry);
  const [localNumber, setLocalNumber] = useState("");

  const fullPhone = useMemo(
    () => formatE164Phone(country.callingCode, localNumber),
    [country.callingCode, localNumber],
  );

  return (
    <div className={styles.field}>
      <label className={labelClassName} htmlFor={localInputId}>
        {label}
      </label>

      <div className={styles.row}>
        <select
          id={countrySelectId}
          className={styles.countrySelect}
          value={country.iso2}
          onChange={(e) => {
            const next = COUNTRIES.find((c) => c.iso2 === e.target.value);
            if (next) setCountry(next);
          }}
          aria-label="Country code"
        >
          {COUNTRIES.map((option) => (
            <option key={option.iso2} value={option.iso2}>
              {countryFlag(option.iso2)} +{option.callingCode}
            </option>
          ))}
        </select>

        <div className={styles.localInputWrapper}>
          <span className={styles.callingCode} aria-hidden="true">
            +{country.callingCode}
          </span>
          <input
            className={styles.localInput}
            id={localInputId}
            type="tel"
            inputMode="numeric"
            autoComplete={autoComplete}
            required={required}
            placeholder="788123456"
            value={localNumber}
            onChange={(e) => setLocalNumber(e.target.value.replace(/\D/g, ""))}
          />
        </div>
      </div>

      <input type="hidden" name={name} value={fullPhone} />

      {error ? (
        <p className={errorClassName} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
