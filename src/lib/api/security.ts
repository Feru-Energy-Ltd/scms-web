import { apiRequestAuth } from "./http";

/** Fetch all admin roles with their assigned permissions. */
export async function fetchAdminRoles() {
  return apiRequestAuth<unknown>("/auth/management/admin-roles");
}

/** Fetch all platform permission definitions. */
export async function fetchPermissionDefinitions() {
  return apiRequestAuth<unknown>("/auth/management/permissions");
}

/** Fetch provider role definitions and permission mappings for the caller's org. */
export async function fetchProviderRoles(providerId: number) {
  return apiRequestAuth<unknown>(`/auth/providers/${providerId}/roles`);
}

/** Fetch all provider permission definitions for the caller's org. */
export async function fetchProviderPermissionDefinitions(providerId: number) {
  return apiRequestAuth<unknown>(`/auth/providers/${providerId}/permissions`);
}
