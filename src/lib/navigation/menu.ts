export type AppMenuItem = {
  name: string;
  url: string;
};

export type AppMenuSection = {
  label: string;
  items: AppMenuItem[];
};

type MenuEntry = {
  item: AppMenuItem;
  /** Empty = always visible when logged in. User needs any listed permission. */
  permissions: string[];
  /** If set, user must also have any of these roles. */
  roles?: string[];
  /** Hide this entry if the user has any of these permissions (e.g. replace view-only with actionable item). */
  hideIfPermissions?: string[];
};

const MENU_SECTIONS: { label: string; entries: MenuEntry[] }[] = [
  {
    label: "Main",
    entries: [
      { item: { name: "Dashboard", url: "/account" }, permissions: [] },
      {
        item: { name: "Charging Stations", url: "/account/stations" },
        permissions: ["admin:chargers:read", "provider:chargers:read"],
      },
      {
        item: { name: "Charge Boxes", url: "/account/charge-boxes" },
        permissions: ["admin:chargers:read", "provider:chargers:read"],
      },
      {
        item: { name: "Reservations", url: "/account/reservations" },
        permissions: ["admin:reservations:read", "provider:reservations:read"],
      },
      {
        item: { name: "Charging Sessions", url: "/account/sessions" },
        permissions: ["admin:sessions:read", "provider:sessions:read"],
      },
    ],
  },
  {
    label: "Management",
    entries: [
      {
        item: { name: "Staff", url: "/account/users" },
        permissions: [
          "provider:users:read",
          "provider:roles:update",
          "admin:roles:read",
        ],
      },
      {
        item: { name: "Invitations", url: "/account/invitations" },
        permissions: ["provider:org:read", "provider:org:update"],
      },
      {
        item: { name: "Billing", url: "/account/billing" },
        permissions: ["provider:reports:read", "admin:reports:read"],
      },
      {
        item: { name: "Reports", url: "/account/reports" },
        permissions: ["provider:reports:read", "admin:reports:read"],
      },
      {
        item: { name: "Service Providers", url: "/account/service-providers" },
        permissions: ["admin:providers:read", "admin:providers:create"],
      },
      {
        item: { name: "Customers", url: "/account/customers" },
        permissions: ["admin:users:read"],
      },
      {
        item: { name: "Vehicles", url: "/account/vehicles" },
        permissions: ["admin:vehicles:read", "provider:vehicles:read"],
      },
      {
        item: { name: "Support Tickets", url: "/account/support-tickets" },
        permissions: ["admin:support:read", "provider:support:read"],
      },
    ],
  },
  {
    label: "Settings",
    entries: [
      {
        item: { name: "Pricing", url: "/account/pricing" },
        permissions: ["admin:pricing:read", "provider:pricing:read"],
      },
      {
        item: { name: "Roles & Permissions", url: "/account/permissions" },
        permissions: ["admin:roles:read"],
        roles: ["SYSTEM_ADMIN_MASTER", "SYSTEM_ADMIN_MANAGER"],
      },
    ],
  },
];

function isEntryVisible(
  entry: MenuEntry,
  permSet: Set<string>,
  roleSet: Set<string>,
): boolean {
  if (entry.hideIfPermissions?.some((p) => permSet.has(p))) return false;
  if (entry.roles?.length && !entry.roles.some((r) => roleSet.has(r))) {
    return false;
  }
  if (entry.permissions.length === 0) return true;
  return entry.permissions.some((p) => permSet.has(p));
}

/**
 * Build grouped sidebar menu based on the user's JWT permissions (and optional roles).
 * Sections with no visible items are omitted.
 */
export function getMenuSectionsForPermissions(
  permissions: string[],
  roles: string[] = [],
): AppMenuSection[] {
  const permSet = new Set(permissions);
  const roleSet = new Set(roles);
  return MENU_SECTIONS.map((section) => ({
    label: section.label,
    items: section.entries
      .filter((entry) => isEntryVisible(entry, permSet, roleSet))
      .map((entry) => entry.item),
  })).filter((section) => section.items.length > 0);
}

/**
 * Flat menu list (all sections merged). Useful for active-route matching.
 */
export function getMenuForPermissions(
  permissions: string[],
  roles: string[] = [],
): AppMenuItem[] {
  return getMenuSectionsForPermissions(permissions, roles).flatMap(
    (s) => s.items,
  );
}
