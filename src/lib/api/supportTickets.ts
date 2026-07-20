import { supportApiPath, API_BASE_URL } from "../config";
import { apiRequestAuth, type Page } from "./http";
import { getAccessToken } from "../auth/session";

const BASE = supportApiPath("/tickets");

export const SUPPORT_ATTACHMENT_MAX_COUNT = 5;
export const SUPPORT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const SUPPORT_ATTACHMENT_ACCEPT =
  "image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type TicketStatus =
  | "OPEN"
  | "AWAITING_SUPPORT"
  | "AWAITING_CUSTOMER"
  | "RESOLVED"
  | "CLOSED";

export type TicketSource = "MOBILE" | "WEB";

export type AuthorType = "CUSTOMER" | "PROVIDER" | "ADMIN" | "SYSTEM";

export type MessageChannel = "APP" | "WEB" | "EMAIL" | "ADMIN_PORTAL";

export interface TicketAttachment {
  id: number;
  fileName: string;
  contentType: string;
  url: string;
  sizeBytes: number | null;
  createdAt: string;
}

export interface TicketMessage {
  id: number;
  authorType: AuthorType;
  authorEmail: string;
  body: string;
  channel: MessageChannel;
  createdAt: string;
  attachments?: TicketAttachment[];
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

export async function uploadTicketAttachment(
  ticketId: number,
  file: File,
  messageId?: number,
): Promise<SupportTicket> {
  const form = new FormData();
  form.append("file", file);
  const q = messageId != null ? `?messageId=${messageId}` : "";
  const token = getAccessToken();
  const res = await fetch(
    new URL(`${BASE}/${ticketId}/attachments${q}`, API_BASE_URL).toString(),
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    },
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => undefined)) as
      | { message?: string }
      | undefined;
    throw new Error(body?.message ?? `Attachment upload failed (${res.status})`);
  }
  return (await res.json()) as SupportTicket;
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

export function formatAttachmentSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageContentType(contentType: string): boolean {
  return contentType.startsWith("image/");
}

export function countTicketAttachments(ticket: Pick<SupportTicket, "messages">): number {
  return ticket.messages.reduce(
    (total, message) => total + (message.attachments?.length ?? 0),
    0,
  );
}
