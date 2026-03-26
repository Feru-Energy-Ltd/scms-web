import { apiRequest } from "./http";
import type { Phase1Response, TokenResponse } from "../types/auth";

export async function login(email: string, password: string) {
  // Backend runs under /auth context path, and the API gateway routes /auth/**
  // to the auth-service.
  return apiRequest<Phase1Response>("/auth/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function selectContext(
  identityToken: string,
  contextId: number,
) {
  return apiRequest<TokenResponse>("/auth/api/auth/select-context", {
    method: "POST",
    body: { identityToken, contextId },
  });
}

