import { getStoredPermissions } from "@/lib/auth/session";

export type PricingPermissionFlags = {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManage: boolean;
};

export function getPricingPermissions(
  permissions: Iterable<string> = getStoredPermissions(),
): PricingPermissionFlags {
  const perms = new Set(permissions);
  const canRead =
    perms.has("admin:pricing:read") || perms.has("provider:pricing:read");
  const canCreate = perms.has("admin:pricing:create");
  const canUpdate = perms.has("admin:pricing:update");
  const canDelete = perms.has("admin:pricing:delete");
  return {
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    canManage: canCreate || canUpdate || canDelete,
  };
}
