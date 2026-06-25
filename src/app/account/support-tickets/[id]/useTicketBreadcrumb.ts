"use client";

import { useMemo } from "react";
import { useBreadcrumbOverrides } from "@/components/account/BreadcrumbContext";

export function useTicketBreadcrumb(
  ticketId: string | number | undefined,
  ticketNumber?: string | null,
) {
  const label = ticketNumber?.trim() || "Ticket";

  useBreadcrumbOverrides(
    useMemo(() => {
      if (ticketId == null || ticketId === "") return {};
      return {
        [`/account/support-tickets/${ticketId}`]: label,
      };
    }, [ticketId, label]),
  );
}
