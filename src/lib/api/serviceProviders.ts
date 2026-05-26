import { API_BASE_URL } from "../config";
import { getAccessToken } from "../auth/session";
import { apiRequestAuth, type Page } from "./http";

const BASE = "/auth/management/service-providers";

export interface ProviderDetail {
  id: number;
  userId: number;
  email: string;
  displayName: string;
  businessName: string;
  registration: string | null;
  phone: string | null;
  logoUrl: string | null;
  website: string | null;
  address: string | null;
  activeTeamCount: number;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  createdAt: string;
}

export async function fetchProvider(id: number) {
  return apiRequestAuth<ProviderDetail>(`${BASE}/${id}`);
}

export async function updateProvider(
  id: number,
  body: Partial<{
    businessName: string;
    phone: string;
    logoUrl: string;
    website: string;
    address: string;
  }>,
) {
  return apiRequestAuth<ProviderDetail>(`${BASE}/${id}`, { method: "PUT", body });
}

export async function uploadProviderLogo(id: number, file: File): Promise<ProviderDetail> {
  const form = new FormData();
  form.append("file", file);
  const token = getAccessToken();
  const res = await fetch(new URL(`${BASE}/${id}/logo`, API_BASE_URL).toString(), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) throw new Error(`Logo upload failed (${res.status})`);
  return (await res.json()) as ProviderDetail;
}

export interface AdminStaffMember {
  userId: number;
  email: string;
  displayName: string;
  role: string;
  status: string;
}

export async function fetchProviderStaffAdmin(
  id: number,
  page = 0,
  size = 20,
): Promise<Page<AdminStaffMember>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  return apiRequestAuth<Page<AdminStaffMember>>(`${BASE}/${id}/staff?${q}`);
}

export async function updateProviderStaffAdmin(
  id: number,
  userId: number,
  role: string,
): Promise<AdminStaffMember> {
  return apiRequestAuth<AdminStaffMember>(`${BASE}/${id}/staff/${userId}`, {
    method: "PUT",
    body: { role },
  });
}

export async function suspendProviderStaffAdmin(id: number, userId: number): Promise<void> {
  await apiRequestAuth<void>(`${BASE}/${id}/staff/${userId}`, { method: "DELETE" });
}

export async function activateProviderStaffAdmin(
  id: number,
  userId: number,
): Promise<AdminStaffMember> {
  return apiRequestAuth<AdminStaffMember>(`${BASE}/${id}/staff/${userId}/activate`, {
    method: "POST",
  });
}

export interface ProviderListItem {
  id: number;
  businessName: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  registration: string | null;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  createdAt: string | null;
}

export interface FetchProvidersOptions {
  status?: "PENDING" | "ACTIVE" | "SUSPENDED";
  search?: string;
  page?: number;
  size?: number;
}

export async function fetchServiceProviders(
  opts: FetchProvidersOptions = {},
): Promise<Page<ProviderListItem>> {
  const { status, search, page = 0, size = 20 } = opts;
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) q.set("status", status);
  if (search) q.set("search", search);
  return apiRequestAuth<Page<ProviderListItem>>(`${BASE}?${q}`);
}

export async function fetchActiveProviders(): Promise<ProviderListItem[]> {
  const q = new URLSearchParams({ status: "ACTIVE", size: "200" });
  const res = await apiRequestAuth<{ content: ProviderListItem[] }>(`${BASE}?${q}`);
  return res.content ?? [];
}

export async function setServiceProviderStatus(
  id: number,
  status: "ACTIVE" | "SUSPENDED",
) {
  return apiRequestAuth<void>(`${BASE}/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}
