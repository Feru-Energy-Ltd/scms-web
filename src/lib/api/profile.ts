import { authApiPath } from "../config";
import { apiRequestAuth } from "./http";

// ── Types ──

export interface ProfileResponse {
  id: number;
  userId: number;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  enabled: boolean;
  createdAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  displayName?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// ── API Functions ──

export async function fetchProfile(): Promise<ProfileResponse> {
  return apiRequestAuth<ProfileResponse>(authApiPath("/profile"));
}

export async function updateProfile(
  data: UpdateProfileRequest,
): Promise<ProfileResponse> {
  return apiRequestAuth<ProfileResponse>(authApiPath("/profile"), {
    method: "PUT",
    body: data,
  });
}

export async function changePassword(
  data: ChangePasswordRequest,
): Promise<void> {
  await apiRequestAuth<void>(authApiPath("/profile/change-password"), {
    method: "POST",
    body: data,
  });
}
