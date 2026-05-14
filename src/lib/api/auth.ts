import { apiRequest } from "./http";
import type { ProviderRegistrationPayload, TokenResponse } from "../types/auth";

export type MessageResponse = { message: string };

export async function login(email: string, password: string) {
  // Backend runs under /auth context path, and the API gateway routes /auth/**
  // to the auth-service.
  return apiRequest<TokenResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function selectContext(
  identityToken: string,
  contextId: number,
) {
  return apiRequest<TokenResponse>("/auth/select-context", {
    method: "POST",
    body: { identityToken, contextId },
  });
}

export async function registerProvider(payload: ProviderRegistrationPayload) {
  return apiRequest("/auth/providers/register", {
    method: "POST",
    body: payload,
  });
}

export async function verifyProviderEmail(token: string) {
  const query = new URLSearchParams({ token });
  return apiRequest<MessageResponse>(
    `/auth/verify-provider-email?${query.toString()}`,
    { method: "GET" },
  );
}

export async function acceptProviderInvitation(body: {
  token: string;
  password?: string;
  displayName?: string;
}) {
  return apiRequest<TokenResponse>("/auth/invitations/provider/accept", {
    method: "POST",
    body,
  });
}

export async function acceptAccountInvitation(body: {
  token: string;
  password?: string;
  displayName?: string;
}) {
  return apiRequest<TokenResponse>("/auth/invitations/accept", {
    method: "POST",
    body,
  });
}

