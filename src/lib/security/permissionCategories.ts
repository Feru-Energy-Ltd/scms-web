export type PermissionDef = { id: number; name: string };

const KEYWORDS = [
  { key: "customers", test: (name: string) => name.includes("CUSTOMER") },
  { key: "chargers", test: (name: string) => name.includes("CHARGER") },
  {
    key: "users",
    test: (name: string) =>
      name.includes("USER") || name.includes("ROLE"),
  },
  { key: "rfid", test: (name: string) => name.includes("RFID") },
  { key: "reports", test: (name: string) => name.includes("REPORT") },
] as const;

export function categorizePermissions(list: PermissionDef[]) {
  const used = new Set<string>();
  const groups: Record<string, PermissionDef[]> = {};

  for (const { key, test } of KEYWORDS) {
    groups[key] = list.filter((p) => {
      if (!test(p.name)) return false;
      used.add(p.name);
      return true;
    });
  }

  groups.others = list.filter((p) p.name && !used.has(p.name));

  return groups;
}
