export type MatrixColumn = {
  key: string;
  label: string;
  resources: string[];
};

export type RolePermissionRow = {
  name: string;
  permissions: string[];
};

export type MatrixCell = {
  shorthand: string;
  permissions: string[];
};

export type RoleMatrixRow = {
  roleName: string;
  cells: Record<string, MatrixCell>;
};

const ADMIN_ROLE_ORDER = [
  "SYSTEM_ADMIN_MANAGER",
  "SYSTEM_ADMIN_STAFF",
  "SYSTEM_ADMIN_ACCOUNT_MANAGER",
  "SYSTEM_ADMIN_CUSTOMER_SUPPORT",
  "SYSTEM_ADMIN_REGULATORY_OFFICER",
];

const PROVIDER_ROLE_ORDER = [
  "SERVICE_PROVIDER_OWNER",
  "SERVICE_PROVIDER_MANAGER",
  "SERVICE_PROVIDER_STAFF",
];

export const ADMIN_MATRIX_COLUMNS: MatrixColumn[] = [
  { key: "chargers", label: "Charger/Stations", resources: ["chargers", "stations"] },
  { key: "wallet", label: "Wallet", resources: ["wallet"] },
  { key: "reports", label: "Reports", resources: ["reports"] },
  { key: "users", label: "Users", resources: ["users"] },
  { key: "providers", label: "Providers/Orgs", resources: ["providers"] },
  { key: "vehicles", label: "Vehicles", resources: ["vehicles"] },
  { key: "transactions", label: "Transactions", resources: ["transactions"] },
  { key: "energy", label: "Energy", resources: ["energy"] },
  { key: "reservations", label: "Reservations", resources: ["reservations"] },
  { key: "pricing", label: "Pricing", resources: ["pricing"] },
  { key: "sessions", label: "Charging session", resources: ["sessions"] },
  { key: "roles", label: "Roles & Permissions", resources: ["roles"] },
];

export const PROVIDER_MATRIX_COLUMNS: MatrixColumn[] = [
  { key: "chargers", label: "Charger/Stations", resources: ["chargers"] },
  { key: "wallet", label: "Wallet", resources: ["wallet"] },
  { key: "reports", label: "Reports", resources: ["reports"] },
  { key: "users", label: "Users", resources: ["users"] },
  { key: "org", label: "Providers/Orgs", resources: ["org"] },
  { key: "vehicles", label: "Vehicles", resources: ["vehicles"] },
  { key: "transactions", label: "Transactions", resources: ["transactions"] },
  { key: "energy", label: "Energy", resources: ["energy"] },
  { key: "reservations", label: "Reservations", resources: ["reservations"] },
  { key: "pricing", label: "Pricing", resources: ["pricing"] },
  { key: "sessions", label: "Charging session", resources: ["sessions"] },
  { key: "roles", label: "Roles", resources: ["roles"] },
];

export const MATRIX_LEGEND = [
  { code: "—", meaning: "No access" },
  { code: "R", meaning: "Read / view" },
  { code: "RU", meaning: "Read + update" },
  { code: "CRU", meaning: "Create + read + update" },
  { code: "CRUD", meaning: "Full access (create, read, update, delete)" },
  { code: "RD", meaning: "Read + delete" },
] as const;

type ParsedPermission = {
  name: string;
  resource: string;
  action: string;
};

function parsePermissionName(name: string): ParsedPermission | null {
  const parts = name.split(":");
  if (parts.length < 3) return null;
  return { name, resource: parts[1], action: parts[2] };
}

export function actionsToShorthand(actions: Set<string>): string {
  const hasC = actions.has("create");
  const hasR = actions.has("read");
  const hasU = actions.has("update");
  const hasD = actions.has("delete");

  if (!hasC && !hasR && !hasU && !hasD) return "—";
  if (hasC && hasR && hasU && hasD) return "CRUD";
  if (hasC && hasR && hasU) return "CRU";
  if (hasR && hasU && !hasC && !hasD) return "RU";
  if (hasR && hasD && !hasC && !hasU) return "RD";
  if (hasR && !hasC && !hasU && !hasD) return "R";

  let shorthand = "";
  if (hasC) shorthand += "C";
  if (hasR) shorthand += "R";
  if (hasU) shorthand += "U";
  if (hasD) shorthand += "D";
  return shorthand || "—";
}

function sortRoles(rows: RolePermissionRow[], order: string[]): RolePermissionRow[] {
  const rank = new Map(order.map((name, i) => [name, i]));
  return [...rows].sort((a, b) => {
    const ra = rank.get(a.name) ?? 999;
    const rb = rank.get(b.name) ?? 999;
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });
}

export function buildPermissionMatrix(
  roles: RolePermissionRow[],
  columns: MatrixColumn[],
  roleOrder: string[],
): RoleMatrixRow[] {
  const sorted = sortRoles(roles, roleOrder);

  return sorted.map((role) => {
    const parsed = role.permissions
      .map(parsePermissionName)
      .filter((p): p is ParsedPermission => p != null);

    const cells: Record<string, MatrixCell> = {};
    for (const column of columns) {
      const resourceSet = new Set(column.resources);
      const matching = parsed.filter((p) => resourceSet.has(p.resource));
      const actions = new Set(matching.map((p) => p.action));
      cells[column.key] = {
        shorthand: actionsToShorthand(actions),
        permissions: matching.map((p) => p.name).sort(),
      };
    }

    return { roleName: role.name, cells };
  });
}

export function buildAdminMatrix(roles: RolePermissionRow[]): RoleMatrixRow[] {
  return buildPermissionMatrix(roles, ADMIN_MATRIX_COLUMNS, ADMIN_ROLE_ORDER);
}

export function buildProviderMatrix(roles: RolePermissionRow[]): RoleMatrixRow[] {
  return buildPermissionMatrix(roles, PROVIDER_MATRIX_COLUMNS, PROVIDER_ROLE_ORDER);
}
