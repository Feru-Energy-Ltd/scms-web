export type AppMenuItem = {
  name: string;
  url: string;
};

const baseLinks: AppMenuItem[] = [
  { name: "Dashboard", url: "/account" },
  { name: "Station map", url: "/account/dashboard" },
  { name: "Approvals", url: "/account/approvals" },
];

const roleLinks: Record<string, AppMenuItem[]> = {
  ROLE_ADMIN: [
    { name: "Organisations", url: "/account/organisations" },
    { name: "Roles and Permissions", url: "/account/permissions" },
    { name: "Back Office users", url: "/account/users" },
    { name: "Customers", url: "/account/customers" },
    { name: "Charge Boxes", url: "/account/charge-boxes" },
  ],
  ROLE_OPERATOR: [
    { name: "Charge Boxes", url: "/account/charge-boxes" },
    { name: "Org Members", url: "/account/users" },
  ],
  ROLE_OPERATOR_STAFF: [{ name: "Charge Boxes", url: "/account/charge-boxes" }],
  ROLE_COMPLIANCE_AUDITOR: [{ name: "Compliance Reports", url: "/account/charge-boxes" }],
  ROLE_ENERGY_AUDITOR: [{ name: "Energy Reports", url: "/account/charge-boxes" }],
  ROLE_ACCOUNTANT: [{ name: "Financial Reports", url: "/account/charge-boxes" }],
  ROLE_OPERATOR_ENGINEER: [{ name: "Charge Boxes", url: "/account/charge-boxes" }],
};

export function getMenuForRole(role: string | null): AppMenuItem[] {
  if (!role) return baseLinks;
  const roleSpecific = roleLinks[role] ?? [];
  return [...baseLinks, ...roleSpecific];
}
