"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchProvider } from "@/lib/api/serviceProviders";
import { useBreadcrumbOverrides } from "./BreadcrumbContext";

export function useProviderBreadcrumb(
  providerId: string | number | undefined,
  businessName?: string | null,
) {
  const [fetchedName, setFetchedName] = useState<string | null>(null);

  useEffect(() => {
    if (businessName?.trim() || providerId == null || providerId === "") return;

    let alive = true;
    void fetchProvider(Number(providerId))
      .then((provider) => {
        if (alive) setFetchedName(provider.businessName);
      })
      .catch(() => {
        if (alive) setFetchedName(null);
      });

    return () => {
      alive = false;
    };
  }, [businessName, providerId]);

  const label = businessName?.trim() || fetchedName || "Provider";

  useBreadcrumbOverrides(
    useMemo(() => {
      if (providerId == null || providerId === "") return {};
      return {
        [`/account/service-providers/${providerId}`]: label,
      };
    }, [providerId, label]),
  );
}
