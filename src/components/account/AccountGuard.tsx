"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession, hasActiveAccessSession } from "@/lib/auth/session";
import { buildLoginPath } from "@/lib/auth/redirect";

export default function AccountGuard({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasActiveAccessSession()) {
      clearSession();
      const intended = window.location.pathname + window.location.search;
      router.replace(buildLoginPath(intended));
      return;
    }
    setReady(true); // eslint-disable-line react-hooks/set-state-in-effect -- auth guard must defer render until client-side session check
  }, [router]);

  if (!ready) {
    return null;
  }

  return children;
}
