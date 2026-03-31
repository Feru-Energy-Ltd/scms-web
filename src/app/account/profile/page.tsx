"use client";

import { useEffect, useState } from "react";
import { decodeJwtPayload } from "@/lib/auth/jwt";
import {
  getAccessTokenContext,
  getOrganizationIdFromAccessToken,
} from "@/lib/auth/jwtContext";
import { getAccessToken, getStoredRole } from "@/lib/auth/session";
import styles from "@/components/account/ResourceList.module.css";

export default function AccountProfilePage() {
  const [ctx, setCtx] = useState(() => getAccessTokenContext());
  const [rawClaims, setRawClaims] = useState<Record<string, unknown> | null>(
    null,
  );

  useEffect(() => {
    setCtx(getAccessTokenContext());
    const token = getAccessToken();
    setRawClaims(token ? decodeJwtPayload(token) : null);
  }, []);

  return (
    <div>
      <h1 className={styles.h1}>Profile</h1>
      <p className={styles.muted}>
        Session-backed profile context. Full account forms can call the users
        API next.
      </p>

      <div className={styles.field}>
        <span className={styles.label}>Stored role</span>
        <p>{getStoredRole() ?? "—"}</p>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Organization</span>
        <p>{ctx.organizationName ?? "—"}</p>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Email</span>
        <p>{ctx.email ?? "—"}</p>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Token role claim</span>
        <p>{ctx.role ?? "—"}</p>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Organization id (JWT)</span>
        <p>{getOrganizationIdFromAccessToken() ?? "—"}</p>
      </div>

      {rawClaims ? (
        <div className={styles.field}>
          <span className={styles.label}>Access token claims</span>
          <pre className={styles.pre}>
            {JSON.stringify(rawClaims, null, 2)}
          </pre>
        </div>
      ) : (
        <p className={styles.muted}>No access token in this session.</p>
      )}
    </div>
  );
}
