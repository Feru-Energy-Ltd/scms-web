/** Strip non-digits from a local phone number input. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Build an E.164 phone string the same way the mobile client does:
 * `+{callingCode}{localDigits}` (e.g. +250788123456).
 */
export function formatE164Phone(callingCode: string, localNumber: string): string {
  const digits = digitsOnly(localNumber);
  if (!digits) return "";
  return `+${callingCode}${digits}`;
}
