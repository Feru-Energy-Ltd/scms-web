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

const providerUsersItem: AppMenuItem = {
  name: "Users",
  url: "/account/users",
};

const roleCodeLinks: Record<string, AppMenuItem[]> = {
  SYSTEM_ADMIN: [
    { name: "Service providers", url: "/account/service-providers" },
    { name: "Roles and Permissions", url: "/account/permissions" },
    { name: "Back Office users", url: "/account/users" },
    { name: "Customers", url: "/account/customers" },
    { name: "Charge Boxes", url: "/account/charge-boxes" },
  ],
  SUPER_ADMIN: [
    { name: "Service providers", url: "/account/service-providers" },
    { name: "Roles and Permissions", url: "/account/permissions" },
    { name: "Back Office users", url: "/account/users" },
    { name: "Customers", url: "/account/customers" },
    { name: "Charge Boxes", url: "/account/charge-boxes" },
  ],
  PROVIDER_OWNER: [
    { name: "Charge Boxes", url: "/account/charge-boxes" },
    providerUsersItem,
    invitationsItem,
  ],
  PROVIDER_MANAGER: [
    { name: "Charge Boxes", url: "/account/charge-boxes" },
    providerUsersItem,
    invitationsItem,
  ],
  PROVIDER_STAFF: [{ name: "Charge Boxes", url: "/account/charge-boxes" }],
  SUPPORT_ADMIN: [
    approvalsItem,
    { name: "Customers", url: "/account/customers" },
    providerUsersItem,
  ],
  CUSTOMER: [
    { name: "My account", url: "/account" },
    { name: "Charge Boxes", url: "/account/charge-boxes" },
  ],
  TBD: [{ name: "Compliance Reports", url: "/account/charge-boxes" }],
};

export function getMenuForRoleCode(roleCode: string): AppMenuItem[] {
  const links: AppMenuItem[] = [...baseLinks];
  if (!roleCode) return links;
  const roleSpecificLinks = roleCodeLinks[roleCode] ?? [];
  return [...links, ...roleSpecificLinks];
}

export const getMenuForIdentityType = getMenuForRoleCode;
