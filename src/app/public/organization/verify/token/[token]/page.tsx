"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { verifyOrganizationToken } from "@/lib/api/publicOrg";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";

export default function VerifyOrgTokenPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ? decodeURIComponent(params.token) : "";
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await verifyOrganizationToken(token);
        if (!cancelled) setResult(data);
      } catch (e) {
        showApiErrorToast(e, { fallbackMessage: "Verification failed." });
        if (!cancelled) setResult(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main style={{ padding: 24, maxWidth: 820, margin: "0 auto" }}>
      <h1 className={styles.h1}>Organization verification</h1>
      {loading ? (
        <p className={styles.muted}>Verifying…</p>
      ) : !token ? (
        <p className={styles.error}>Missing token.</p>
      ) : result != null ? (
        <>
          <p className={styles.muted}>Response</p>
          <pre className={styles.pre}>{JSON.stringify(result, null, 2)}</pre>
        </>
      ) : (
        <p className={styles.error}>Could not complete verification.</p>
      )}
    </main>
  );
}
