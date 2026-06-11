import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy `/login` URLs forward to `/` (sign-in is the app root). */
export default async function LoginRedirectPage({ searchParams }: Props) {
  const params = await searchParams;
  const qs = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const entry of value) qs.append(key, entry);
    } else {
      qs.set(key, value);
    }
  }

  const query = qs.toString();
  redirect(query ? `/?${query}` : "/");
}
