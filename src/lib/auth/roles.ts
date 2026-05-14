export const ROLE_LABEL_BY_CODE = {
  PROVIDER_STAFF: "Staff",
  PROVIDER_MANAGER: "Manager",
  PROVIDER_OWNER: "Owner",
  CUSTOMER: "Customer",
  SUPPORT_ADMIN: "Customer Support",
  SYSTEM_ADMIN: "Admin",
  SUPER_ADMIN: "Superadmin",
  TBD: "Compliance",
} as const;

const ROLE_LABEL_LOOKUP: Record<string, string> = ROLE_LABEL_BY_CODE;

export function getRoleLabel(roleCode: string): string {
  return ROLE_LABEL_LOOKUP[roleCode] ?? roleCode;
}

export function getRoleNote(roleCode: string): string | null {
  if (roleCode === "CUSTOMER") {
    return "Account-level role may be separate.";
  }
  if (roleCode === "TBD") {
    return "Compliance role code is not finalized yet.";
  }
  return null;
}

export function formatRoleValue(value: unknown): string {
  if (Array.isArray(value)) {
    const labels = value
      .map((item) => (typeof item === "string" ? getRoleLabel(item) : ""))
      .filter(Boolean);
    return labels.length ? labels.join(", ") : "—";
  }
  if (typeof value === "string" && value.trim()) {
    return getRoleLabel(value.trim());
  }
  return "—";
}
