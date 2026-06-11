import Link from "next/link";
import { getRoleLabel } from "@/lib/auth/roles";

export default async function RolePage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const roleCode = decodeURIComponent(role);
  const roleLabel = getRoleLabel(roleCode);

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>
        Role: {roleLabel} ({roleCode})
      </h1>
      <p style={{ marginBottom: 16, color: "var(--color-text-muted)" }}>
        This is a placeholder view for role-based routing.
      </p>
      <Link href="/" style={{ color: "var(--color-primary)" }}>
        Back to sign in
      </Link>
    </main>
  );
}
