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
        item: { name: "Support Tickets", url: "/account/support-tickets" },
        permissions: ["admin:support:read", "provider:support:read"],
      },
      {
        item: { name: "Pricing", url: "/account/pricing" },
        permissions: ["admin:pricing:read", "provider:pricing:read"],
      },
    ],
  },
  {
    label: "Settings",
    entries: [
      {
        item: { name: "Roles & Permissions", url: "/account/permissions" },
        permissions: ["admin:roles:read", "provider:roles:read"],
      },
    ],
  },
];

function isEntryVisible(entry: MenuEntry, permSet: Set<string>): boolean {
  if (entry.hideIfPermissions?.some((p) => permSet.has(p))) return false;
  if (entry.permissions.length === 0) return true;
  return entry.permissions.some((p) => permSet.has(p));
}

/**
 * Build grouped sidebar menu based on the user's JWT permissions.
 * Sections with no visible items are omitted.
 */
export function getMenuSectionsForPermissions(
  permissions: string[],
): AppMenuSection[] {
  const permSet = new Set(permissions);
  return MENU_SECTIONS.map((section) => ({
    label: section.label,
    items: section.entries
      .filter((entry) => isEntryVisible(entry, permSet))
      .map((entry) => entry.item),
  })).filter((section) => section.items.length > 0);
}

/**
 * Flat menu list (all sections merged). Useful for active-route matching.
 */
export function getMenuForPermissions(permissions: string[]): AppMenuItem[] {
  return getMenuSectionsForPermissions(permissions).flatMap((s) => s.items);
}
