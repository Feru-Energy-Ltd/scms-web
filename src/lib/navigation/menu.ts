import { getStoredIdentityType } from "../auth/session";

export type AppMenuItem = {
  name: string;
  url: string;
};

const baseLinks: AppMenuItem[] = [
  { name: "Dashboard", url: "/account" },
  { name: "Station map", url: "/account/dashboard" },
];

const approvalsItem: AppMenuItem = {
  name: "Approvals",
  url: "/account/approvals",
};

const invitationsItem: AppMenuItem = {
  name: "Invitations",
  url: "/account/invitations",
};

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
  const identityType = getStoredIdentityType();
  const links: AppMenuItem[] = [...baseLinks];
  if (identityType === "SYSTEM_ADMIN") {
    links.push(approvalsItem);
  }
  if (identityType === "SERVICE_PROVIDER") {
    links.push(invitationsItem);
  }

  if (!role) return links;
  const roleSpecific = roleLinks[role] ?? [];
  return [...links, ...roleSpecific];
}
