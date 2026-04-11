import { apiRequest } from "./http";
import type { ProviderRegistrationPayload, Phase1Response, TokenResponse } from "../types/auth";

export type MessageResponse = { message: string };

export async function login(email: string, password: string) {
  // Backend runs under /auth context path, and the API gateway routes /auth/**
  // to the auth-service.
  return apiRequest<Phase1Response>("/auth/login", {
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

