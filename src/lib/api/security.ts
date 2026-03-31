import { apiRequestAuth } from "./http";

export async function fetchRoles(search?: string) {
  const q = search
    ? `?${new URLSearchParams({ search }).toString()}`
    : "";
  return apiRequestAuth<unknown>(`/security/roles${q}`);
}

export async function fetchPermissionDefinitions(search?: string) {
  const q = search
    ? `?${new URLSearchParams({ search }).toString()}`
    : "";
  return apiRequestAuth<unknown>(`/security/roles/permissions${q}`);
}

export async function fetchRoleById(roleId: number) {
  return apiRequestAuth<unknown>(`/security/roles/${roleId}`);
}

export async function createRole(body: {
  name: string;
  /** Permission names (matches legacy CMS payload). */
  permissions: string[];
}) {
  return apiRequestAuth<unknown>("/security/roles/create", {
    method: "POST",
    body,
  });
}

export async function updateRolePermissions(body: {
  roleId: number | string;
  name?: string;
  permissions: Array<{ id: number; name?: string }>;
}) {
  return apiRequestAuth<unknown>("/security/roles/permissions/update", {
    method: "POST",
    body,
  });
}
