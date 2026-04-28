import { decodeJwtPayload } from "../auth/jwt";

export type InvitationScope = "PROVIDER_STAFF" | "CUSTOMER_ACCOUNT";

export type InvitationTokenMeta = {
  scope: InvitationScope;
  inviteeEmail: string;
};

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
  return { scope, inviteeEmail };
}
