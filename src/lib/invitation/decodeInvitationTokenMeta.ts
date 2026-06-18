import { decodeJwtPayload } from "../auth/jwt";

export type InvitationScope = "PROVIDER_STAFF" | "CUSTOMER_ACCOUNT";

export type InvitationTokenMeta = {
  scope: InvitationScope;
  inviteeEmail: string;
  accountId?: number;
  providerId?: number;
};

function claimId(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/**
 * Best-effort decode of invitation JWT claims (no signature check).
 * Used only to choose the accept endpoint and show invitee email.
 */
export function decodeInvitationTokenMeta(
  token: string,
): InvitationTokenMeta | null {
  const p = decodeJwtPayload(token);
  if (!p) return null;
  if (p.token_type !== "invitation") return null;
  const scope = p.invitation_scope;
  if (scope !== "PROVIDER_STAFF" && scope !== "CUSTOMER_ACCOUNT") {
    return null;
  }
  const inviteeEmail =
    typeof p.invitee_email === "string" ? p.invitee_email.trim() : "";
  if (!inviteeEmail) return null;

  const accountId = claimId(p.account_id);
  const providerId = claimId(p.provider_id);

  if (scope === "CUSTOMER_ACCOUNT" && accountId === undefined) return null;
  if (scope === "PROVIDER_STAFF" && providerId === undefined) return null;

  return {
    scope,
    inviteeEmail,
    ...(accountId !== undefined ? { accountId } : {}),
    ...(providerId !== undefined ? { providerId } : {}),
  };
}
