"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import Breadcrumb from "@/components/account/Breadcrumb";
import { buildAccountBreadcrumbs } from "@/lib/navigation/breadcrumbs";
import type { AppMenuItem } from "@/lib/navigation/menu";

type BreadcrumbContextValue = {
  pageOverrides: Record<string, string>;
  registerOverrides: (id: string, overrides: Record<string, string>) => void;
  unregisterOverrides: (id: string) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [overrideSubscribers, setOverrideSubscribers] = useState<
    Record<string, Record<string, string>>
  >({});

  const registerOverrides = useCallback(
    (id: string, overrides: Record<string, string>) => {
      setOverrideSubscribers((current) => {
        const existing = current[id];
        if (
          existing &&
          Object.keys(existing).length === Object.keys(overrides).length &&
          Object.entries(overrides).every(([path, label]) => existing[path] === label)
        ) {
          return current;
        }
        return { ...current, [id]: overrides };
      });
    },
    [],
  );

  const unregisterOverrides = useCallback((id: string) => {
    setOverrideSubscribers((current) => {
      if (!(id in current)) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  const pageOverrides = useMemo(
    () => Object.assign({}, ...Object.values(overrideSubscribers)),
    [overrideSubscribers],
  );

  const value = useMemo(
    () => ({
      pageOverrides,
      registerOverrides,
      unregisterOverrides,
    }),
    [pageOverrides, registerOverrides, unregisterOverrides],
  );

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbOverrides(overrides: Record<string, string>) {
  const subscriberId = useId();
  const { registerOverrides, unregisterOverrides } = useContext(BreadcrumbContext) ?? {};

  const serialized = JSON.stringify(overrides);

  useEffect(() => {
    if (!registerOverrides || !unregisterOverrides) {
      throw new Error(
        "useBreadcrumbOverrides must be used within BreadcrumbProvider",
      );
    }

    const parsed = JSON.parse(serialized) as Record<string, string>;
    registerOverrides(subscriberId, parsed);
    return () => unregisterOverrides(subscriberId);
  }, [registerOverrides, unregisterOverrides, subscriberId, serialized]);
}

export function AccountBreadcrumbs({
  menuItems,
}: {
  menuItems: AppMenuItem[];
}) {
  const pathname = usePathname();
  const ctx = useContext(BreadcrumbContext);
  const items = useMemo(
    () =>
      buildAccountBreadcrumbs(
        pathname,
        menuItems,
        ctx?.pageOverrides ?? {},
      ),
    [pathname, menuItems, ctx?.pageOverrides],
  );

  return <Breadcrumb items={items} />;
}
