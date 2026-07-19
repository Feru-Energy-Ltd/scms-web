import { isHiddenRole } from "@/lib/auth/roles";
import { apiRequestAuth, type Page } from "./http";

export type SystemAdminUser = {
  id: number;
  userId: number;
  email: string;
  displayName: string;
  employeeId: string | null;
  department: string | null;
  enabled: boolean;
  roles: string[];
  createdAt: string;
};

export type AdminRoleOption = {
  id: number;
  name: string;
};

export type CreateSystemAdminRequest = {
  email: string;
  password: string;
  displayName: string;
  employeeId?: string;
  department?: string;
  roleIds?: number[];
};

export type UpdateSystemAdminRequest = {
  displayName?: string;
  employeeId?: string;
  department?: string;
};

export async function fetchSystemAdmins(
  page = 0,
  size = 50,
): Promise<Page<SystemAdminUser>> {
  const q = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  const raw = await apiRequestAuth<Page<SystemAdminUser>>(
    `/auth/management/system-admins?${q}`,
  );
  return {
    content: normalizeSystemAdminPage(raw),
    totalElements: raw?.totalElements ?? 0,
    totalPages: raw?.totalPages ?? 0,
    number: raw?.number ?? page,
  };
}

function normalizeSystemAdminPage(raw: Page<SystemAdminUser>): SystemAdminUser[] {
  const content = raw?.content ?? [];
  return content
    .filter((admin) => !rawRoleNames(admin.roles).some(isHiddenRole))
    .map((admin) => ({
      ...admin,
      roles: normalizeRoleNames(admin.roles),
    }));
}

function rawRoleNames(roles: unknown): string[] {
  if (Array.isArray(roles)) return roles.map(String);
  if (roles && typeof roles === "object") {
    return Object.values(roles as Record<string, unknown>).map(String);
  }
  return [];
}

function normalizeRoleNames(roles: unknown): string[] {
  return rawRoleNames(roles).filter((name) => !isHiddenRole(name));
}

export async function createSystemAdmin(
  request: CreateSystemAdminRequest,
): Promise<SystemAdminUser> {
  const raw = await apiRequestAuth<SystemAdminUser>("/auth/management/system-admins", {
    method: "POST",
    body: request,
  });
  return {
    ...raw,
    roles: normalizeRoleNames(raw.roles),
  };
}

export async function assignSystemAdminRole(adminId: number, roleId: number) {
  return apiRequestAuth<void>(`/auth/management/system-admins/${adminId}/roles`, {
    method: "POST",
    body: { roleId },
  });
}

export async function removeSystemAdminRole(adminId: number, roleId: number) {
  return apiRequestAuth<void>(
    `/auth/management/system-admins/${adminId}/roles/${roleId}`,
    { method: "DELETE" },
  );
}

export async function updateSystemAdmin(
  adminId: number,
  request: UpdateSystemAdminRequest,
): Promise<SystemAdminUser> {
  const raw = await apiRequestAuth<SystemAdminUser>(
    `/auth/management/system-admins/${adminId}`,
    { method: "PUT", body: request },
  );
  return {
    ...raw,
    roles: normalizeRoleNames(raw.roles),
  };
}

export async function updateSystemAdminStatus(
  adminId: number,
  enabled: boolean,
): Promise<void> {
  return apiRequestAuth<void>(`/auth/management/system-admins/${adminId}/status`, {
    method: "PATCH",
    body: { enabled },
  });
}
