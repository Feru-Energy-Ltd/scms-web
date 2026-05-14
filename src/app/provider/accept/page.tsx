import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ token?: string }> };

/**
 * Backend emails use `/provider/accept?token=…`. Forward to the unified invite flow.
 */
export default async function ProviderAcceptRedirectPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const q = token?.trim() ? `?token=${encodeURIComponent(token.trim())}` : "";
  redirect(`/invite${q}`);
}
