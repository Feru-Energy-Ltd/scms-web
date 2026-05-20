"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession, hasActiveAccessSession } from "@/lib/auth/session";

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
      router.replace("/login");
      return;
    }
    setReady(true); // eslint-disable-line react-hooks/set-state-in-effect -- auth guard must defer render until client-side session check
  }, [router]);

  if (!ready) {
    return null;
  }

  return children;
}
