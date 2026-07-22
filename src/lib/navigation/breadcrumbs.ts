import type { Crumb } from "@/components/account/Breadcrumb";
import type { AppMenuItem } from "./menu";

const STATIC_SEGMENTS: Record<string, string> = {
  profile: "Profile",
  "charge-boxes": "Charge Boxes",
  create: "Create",
  update: "Update",
  "service-providers": "Service Providers",
  permissions: "Roles & Permissions",
  customers: "Customers",
  vehicles: "Vehicles",
  "support-tickets": "Support Tickets",
  pricing: "Pricing",
  stations: "Charging Stations",
  users: "Staff",
  invitations: "Invitations",
  billing: "Billing",
  reports: "Reports",
};

function shouldSkipSegment(segment: string, parentPath: string): boolean {
  if (
    segment === "stations" &&
    /\/service-providers\/[^/]+$/.test(parentPath)
  ) {
    return true;
  }
  if (segment === "chargers" && /\/stations\/[^/]+$/.test(parentPath)) {
    return true;
  }
  return false;
}

function isVisibleSegment(
  segments: string[],
  index: number,
  parentPath: string,
): boolean {
  const segment = segments[index];
  if (shouldSkipSegment(segment, parentPath)) return false;
  if (index > 0 && segments[index - 1] === "update") return false;
  return true;
}

function menuLabelForPath(
  menuItems: AppMenuItem[],
  path: string,
): string | undefined {
  return menuItems.find((item) => path === item.url)?.name;
}

function normalizeAccountPath(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

function defaultDynamicLabel(
  segment: string,
  parentPath: string,
): string {
  if (parentPath.endsWith("/service-providers")) return "Provider";
  if (/\/stations\/[^/]+$/.test(parentPath)) return "Station";
  if (/\/chargers\/[^/]+$/.test(parentPath)) return segment;
  return decodeURIComponent(segment);
}

export function buildAccountBreadcrumbs(
  pathname: string,
  menuItems: AppMenuItem[],
  overrides: Record<string, string> = {},
): Crumb[] {
  const normalizedPath = normalizeAccountPath(pathname);
  if (!normalizedPath.startsWith("/account")) return [];

  if (normalizedPath === "/account") {
    return [{ label: "Dashboard" }];
  }

  const crumbs: Crumb[] = [{ label: "Dashboard", href: "/account" }];
  const segments = normalizedPath.slice("/account".length).split("/").filter(Boolean);
  let path = "/account";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const parentPath = path;
    path = `${path}/${segment}`;

    if (!isVisibleSegment(segments, i, parentPath)) continue;

    const override = overrides[path];
    const menuLabel = menuLabelForPath(menuItems, path);
    const staticLabel = STATIC_SEGMENTS[segment];

    const label =
      override ??
      staticLabel ??
      menuLabel ??
      defaultDynamicLabel(segment, parentPath);

    crumbs.push({
      label,
      href: path === normalizedPath ? undefined : path,
    });
  }

  return crumbs;
}
