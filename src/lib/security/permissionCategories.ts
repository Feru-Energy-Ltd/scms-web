export type PermissionDef = { id: number; name: string };

/**
 * Categorize permissions by their resource segment (second part of colon-separated name).
 * e.g. "admin:chargers:read" → resource = "chargers"
 *      "provider:reports:read" → resource = "reports"
 */
const RESOURCE_CATEGORIES: { key: string; resources: string[] }[] = [
  { key: "chargers", resources: ["chargers"] },
  { key: "users", resources: ["users", "roles"] },
  { key: "providers", resources: ["providers", "org"] },
  { key: "wallet", resources: ["wallet"] },
  { key: "vehicles", resources: ["vehicles"] },
  { key: "reports", resources: ["reports"] },
  { key: "sessions", resources: ["sessions"] },
  { key: "reservations", resources: ["reservations"] },
  { key: "transactions", resources: ["transactions"] },
  { key: "energy", resources: ["energy"] },
];

function extractResource(name: string): string {
  const parts = name.split(":");
  return parts.length >= 2 ? parts[1] : name;
}

export function categorizePermissions(list: PermissionDef[]) {
  const used = new Set<string>();
  const groups: Record<string, PermissionDef[]> = {};

  for (const { key, resources } of RESOURCE_CATEGORIES) {
    groups[key] = list.filter((p) => {
      const resource = extractResource(p.name);
      if (!resources.includes(resource)) return false;
      used.add(p.name);
      return true;
    });
  }

  groups.others = list.filter(
    (p) => Boolean(p.name) && !used.has(p.name),
  );

  return groups;
}
