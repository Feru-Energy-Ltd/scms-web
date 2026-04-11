"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import styles from "@/components/account/ResourceList.module.css";

/** Public registration via invite token (form + POST can follow the legacy OrgUserCreate flow). */
export default function PublicRegisterOrgUserPage() {
  const params = useParams<{ token: string; orgId: string }>();
  const token = params?.token ? decodeURIComponent(params.token) : "";
  const orgId = params?.orgId ? decodeURIComponent(params.orgId) : "";

  return (
    <main style={{ padding: 24, maxWidth: 820, margin: "0 auto" }}>
      <h1 className={styles.h1}>Register organization user</h1>
      <p className={styles.muted}>
        Organization id: <strong>{orgId || "—"}</strong>
      </p>
      <p className={styles.muted}>
        Invite token:{" "}
        <span
          style={{
            fontFamily: "ui-monospace, monospace",
            padding: "2px 8px",
            borderRadius: 8,
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-2)",
          }}
        >
          {token ? `${token.slice(0, 12)}…` : "—"}
        </span>
      </p>
      <p className={styles.muted}>
        Wire this route to <code>POST /public/organization/create/member/:token</code> when the registration payload is finalized.
      </p>
      <p>
        <Link href="/login">Sign in</Link>
      </p>
    </main>
  );
}
