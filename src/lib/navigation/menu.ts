export type AppMenuItem = {
  name: string;
  url: string;
};

const baseLinks: AppMenuItem[] = [
  { name: "Dashboard", url: "/account" },
];

/**
 * Each menu item is shown when the user holds ANY of the listed permissions.
 * This replaces the old role-based mapping which broke when role names changed.
 */
const permissionMenuItems: { item: AppMenuItem; permissions: string[] }[] = [
  {
    item: { name: "Service Providers", url: "/account/service-providers" },
    permissions: ["admin:providers:read", "admin:providers:create"],
  },
  {
    item: { name: "Roles and Permissions", url: "/account/permissions" },
    permissions: ["admin:roles:read"],
  },
  {
    item: { name: "Customers", url: "/account/customers" },
    permissions: ["admin:users:read"],
  },
  {
    item: { name: "Pricing", url: "/account/pricing" },
    permissions: ["admin:providers:read"],
  },
  {
    item: { name: "Charging Stations", url: "/account/stations" },
    permissions: [
      "admin:chargers:read",
      "provider:chargers:read",
    ],
  },
  {
    item: { name: "Charge Boxes", url: "/account/charge-boxes" },
    permissions: [
      "admin:chargers:read",
      "provider:chargers:read",
    ],
  },
  {
    item: { name: "Staff", url: "/account/users" },
    permissions: ["provider:users:read"],
  },
  {
    item: { name: "Invitations", url: "/account/invitations" },
    permissions: ["provider:org:read", "provider:org:update"],
  },
  {
    item: { name: "Billing", url: "/account/billing" },
    permissions: ["provider:reports:read"],
  },
  {
    item: { name: "Reports", url: "/account/reports" },
    permissions: ["provider:reports:read", "admin:reports:read"],
  },
];

/**
 * Build menu based on the user's actual permissions from the JWT.
 * A menu item appears if the user has at least one of its required permissions.
 */
export function getMenuForPermissions(permissions: string[]): AppMenuItem[] {
  const permSet = new Set(permissions);
  const dynamic = permissionMenuItems
    .filter((entry) => entry.permissions.some((p) => permSet.has(p)))
    .map((entry) => entry.item);
  return [...baseLinks, ...dynamic];
}

/**
 * @deprecated Use getMenuForPermissions() instead.
 * Kept for backward compat — falls back to base menu if role unknown.
 */
export function getMenuForRoleCode(roleCode: string): AppMenuItem[] {
  const links: AppMenuItem[] = [...baseLinks];
  if (!roleCode) return links;
  return links;
}

export const getMenuForIdentityType = getMenuForRoleCode;
