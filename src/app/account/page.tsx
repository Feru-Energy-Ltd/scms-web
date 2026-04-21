"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getAccessTokenContext,
} from "@/lib/auth/jwtContext";
import styles from "@/components/account/ResourceList.module.css";

const quickLinks = [
  { href: "/account/users", label: "Org members" },
  { href: "/account/customers", label: "Customers" },
  { href: "/account/charge-boxes", label: "Charge boxes" },
  { href: "/account/charge-boxes/create", label: "New charger" },
  { href: "/account/organisations", label: "Organisations" },
  { href: "/account/permissions", label: "Roles & permissions" },
  { href: "/account/profile", label: "Profile" },
];

export default function AccountDashboardPage() {
  const [ctx, setCtx] = useState(() => getAccessTokenContext());

  useEffect(() => {
    setCtx(getAccessTokenContext());
  }, []);


  return (
    <div>
      <h1 className={styles.h1}>Dashboard</h1>
      <p className={styles.muted}>
        {ctx.identityType
          ? `Organization: ${ctx.organizationName}`
          : "Workspace"}
        {ctx.email ? ` · ${ctx.email}` : ""}
      </p>
      <p className={styles.muted}>
        Role:{" "}
        <strong>{getStoredRole() ?? ctx.role ?? "—"}</strong>
      </p>

      <div
        style={{
          marginTop: 20,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {quickLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              display: "block",
              padding: 16,
              borderRadius: 12,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-2)",
              color: "var(--color-text)",
              fontWeight: 600,
            }}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
