export const ROLE_LABEL_BY_CODE: Record<string, string> = {
  // System admin roles (V13 names)
  SYSTEM_ADMIN_MASTER: "Master Admin",
  SYSTEM_ADMIN_MANAGER: "Manager",
  SYSTEM_ADMIN_STAFF: "Staff",
  SYSTEM_ADMIN_ACCOUNT_MANAGER: "Account Manager",
  SYSTEM_ADMIN_CUSTOMER_SUPPORT: "Customer Support",
  SYSTEM_ADMIN_REGULATORY_OFFICER: "Regulatory Officer",
  // Provider roles
  SERVICE_PROVIDER_OWNER: "Owner",
  SERVICE_PROVIDER_MANAGER: "Manager",
  SERVICE_PROVIDER_STAFF: "Staff",
  // Customer roles
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export function getRoleLabel(roleCode: string): string {
  return ROLE_LABEL_BY_CODE[roleCode] ?? roleCode;
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
