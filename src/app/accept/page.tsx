import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ token?: string }> };

/**
 * Backend emails use `/accept?token=…` for customer account invitations.
 * Forward to the unified invite flow at `/invite`.
 */
export default async function AccountAcceptRedirectPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const q = token?.trim() ? `?token=${encodeURIComponent(token.trim())}` : "";
  redirect(`/invite${q}`);
}
