import { supportApiPath } from "../config";
import { apiRequestAuth, type Page } from "./http";

const BASE = supportApiPath("/tickets");

export type TicketStatus =
  | "OPEN"
  | "AWAITING_SUPPORT"
  | "AWAITING_CUSTOMER"
  | "RESOLVED"
  | "CLOSED";

export type TicketSource = "MOBILE" | "WEB";

export type AuthorType = "CUSTOMER" | "PROVIDER" | "ADMIN" | "SYSTEM";

export type MessageChannel = "APP" | "EMAIL" | "ADMIN_PORTAL";

export interface TicketMessage {
  id: number;
  authorType: AuthorType;
  authorEmail: string;
  body: string;
  channel: MessageChannel;
  createdAt: string;
}

export interface SupportTicket {
  id: number;
  ticketNumber: string;
  subject: string;
  status: TicketStatus;
  source: TicketSource;
  /** Present when opened by a service provider. */
  providerId: number | null;
  /** "Customer" or the provider business name at ticket creation. */
  originLabel: string;
  customerEmail: string;
  customerName: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  /** Populated on the detail endpoint; empty on list summaries. */
  messages: TicketMessage[];
}

export interface FetchTicketsOptions {
  status?: TicketStatus;
  page?: number;
  size?: number;
}

export async function fetchSupportTickets(
  opts: FetchTicketsOptions = {},
): Promise<Page<SupportTicket>> {
  const { status, page = 0, size = 20 } = opts;
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) q.set("status", status);
  return apiRequestAuth<Page<SupportTicket>>(`${BASE}?${q}`);
}

export async function fetchSupportTicket(id: number): Promise<SupportTicket> {
  return apiRequestAuth<SupportTicket>(`${BASE}/${id}`);
}

export async function createSupportTicket(input: {
  subject: string;
  message: string;
}): Promise<SupportTicket> {
  return apiRequestAuth<SupportTicket>(BASE, {
    method: "POST",
    body: {
      subject: input.subject,
      message: input.message,
      source: "WEB",
    },
  });
}

export async function replyToTicket(
  id: number,
  message: string,
): Promise<SupportTicket> {
  return apiRequestAuth<SupportTicket>(`${BASE}/${id}/messages`, {
    method: "POST",
    body: { message },
  });
}

/** Admin status updates are limited to RESOLVED (resolve) or AWAITING_SUPPORT (reopen). */
export async function updateTicketStatus(
  id: number,
  status: Extract<TicketStatus, "RESOLVED" | "AWAITING_SUPPORT">,
): Promise<SupportTicket> {
  return apiRequestAuth<SupportTicket>(`${BASE}/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Open",
  AWAITING_SUPPORT: "Awaiting support",
  AWAITING_CUSTOMER: "Awaiting customer",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};
