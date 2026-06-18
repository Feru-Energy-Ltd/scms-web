import { selectContext } from "../api/auth";
import type { TokenResponse } from "../types/auth";
import type { InvitationTokenMeta } from "../invitation/decodeInvitationTokenMeta";
import { setSessionTokensFromResponse } from "./session";

/**
 * Persist tokens after login or invitation accept.
 * Provider (and admin) Phase-1 responses include access tokens directly.
 * Customer responses require Phase-2 context selection when autoSelect is false.
 */
export async function establishSessionFromAuthResponse(
  res: TokenResponse,
  opts?: { preferredAccountId?: number },
): Promise<void> {
  if (res.accessToken) {
    setSessionTokensFromResponse(res);
    return;
  }

  if (!res.identityToken) {
    throw new Error("Sign-in did not return session tokens. Please try again.");
  }

  const accountId =
    opts?.preferredAccountId ??
    (res.autoSelect && res.accounts?.length === 1
      ? res.accounts[0]!.accountId
      : undefined);

  if (accountId === undefined) {
    throw new Error(
      "Sign-in requires choosing an account. Please sign in from the homepage.",
    );
  }

  const tokens = await selectContext(res.identityToken, accountId);
  setSessionTokensFromResponse({
    ...tokens,
    identityToken: res.identityToken,
  });
}

/** After accepting an invitation, select the invited account when needed. */
export async function establishSessionAfterInviteAccept(
  res: TokenResponse,
  meta: InvitationTokenMeta,
): Promise<void> {
  const preferredAccountId =
    meta.scope === "CUSTOMER_ACCOUNT" ? meta.accountId : undefined;
  await establishSessionFromAuthResponse(res, { preferredAccountId });
}
