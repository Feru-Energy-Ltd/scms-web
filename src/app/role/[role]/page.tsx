import Link from "next/link";

export default function RolePage({
  params,
}: {
  params: { role: string };
}) {
  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Role: {decodeURIComponent(params.role)}</h1>
      <p style={{ marginBottom: 16, color: "var(--color-text-muted)" }}>
        This is a placeholder view for role-based routing.
      </p>
      <Link href="/" style={{ color: "var(--color-primary)" }}>
        Back to homepage
      </Link>
    </main>
  );
}

