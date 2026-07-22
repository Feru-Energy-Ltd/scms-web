"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchActiveProviders,
  type ProviderListItem,
} from "@/lib/api/serviceProviders";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";

/**
 * Admin provider drill-down state shared by reservations/sessions list pages.
 */
export function useAdminProviderFilter() {
  const isAdmin = useMemo(
    () => getAccessTokenContext()?.identityType === "SYSTEM_ADMIN",
    [],
  );
  const [providerFilter, setProviderFilter] = useState("");
  const [providers, setProviders] = useState<ProviderListItem[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchActiveProviders()
      .then(setProviders)
      .catch(() => {});
  }, [isAdmin]);

  const providerId =
    providerFilter === "" ? undefined : Number(providerFilter);

  return {
    isAdmin,
    providers,
    providerFilter,
    setProviderFilter,
    providerId,
  };
}
