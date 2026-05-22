import { apiRequestAuth } from "./http";

/** Fetch all admin roles with their assigned permissions. */
export async function fetchAdminRoles() {
  return apiRequestAuth<unknown>("/auth/management/admin-roles");
}

/** Fetch all platform permission definitions. */
export async function fetchPermissionDefinitions() {
  return apiRequestAuth<unknown>("/auth/management/permissions");
}
