import { selectContext } from "../api/auth";
import type { Phase1Response } from "../types/auth";
import { decodeJwtPayload } from "./jwt";
import {
  setIdentityTypeAndRole,
  setSessionFromPhase1,
  setSessionFromTokenResponse,
} from "./session";

export class Phase1SessionIncompleteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Phase1SessionIncompleteError";
  }
}

/**
 * Mirrors login success handling: writes tokens and identity to localStorage.
 * @throws Phase1SessionIncompleteError when customer auto-select cannot complete.
 */
export async function persistPhase1Session(res: Phase1Response): Promise<void> {
  let redirectRole = "user";
  const identityType = res.identityType;

  if (identityType === "SERVICE_PROVIDER") {
    redirectRole = res.provider?.role ?? "provider";
    setSessionFromPhase1(res);
    setIdentityTypeAndRole(identityType, redirectRole);
  } else if (identityType === "SYSTEM_ADMIN") {
    setSessionFromPhase1(res);

    const payload = res.accessToken
      ? decodeJwtPayload(res.accessToken)
      : null;
    const roleClaim =
      typeof payload?.role === "string"
        ? payload.role
        : Array.isArray(payload?.roles) && payload.roles.length > 0
          ? String(payload.roles[0])
          : null;

    redirectRole = roleClaim ?? "system-admin";
    setIdentityTypeAndRole(identityType, redirectRole);
  } else if (identityType === "CUSTOMER") {
    const firstAccount = res.accounts?.[0];
    redirectRole = firstAccount?.role ?? "customer";

    if (res.autoSelect && firstAccount) {
      if (!res.identityToken) {
        throw new Phase1SessionIncompleteError(
          "Account context is required, but no identity token was returned.",
        );
      }
      const tokenRes = await selectContext(
        res.identityToken,
        firstAccount.accountId,
      );
      setSessionFromTokenResponse(tokenRes);
      redirectRole = tokenRes.account?.role ?? redirectRole;
    } else {
      setSessionFromPhase1(res);
    }

    setIdentityTypeAndRole(identityType, redirectRole);
  } else {
    setSessionFromPhase1(res);
  }
}
