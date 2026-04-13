"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAccessTokenExpired } from "@/lib/auth/jwt";
import { clearSession, getAccessToken } from "@/lib/auth/session";

export default function AccountGuard({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || isAccessTokenExpired(token)) {
      clearSession();
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return null;
  }

  return children;
}
