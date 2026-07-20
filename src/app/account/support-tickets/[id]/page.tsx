"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, CheckCircle2, RotateCcw, Send } from "lucide-react";
import Link from "next/link";
import { SkeletonLine, SkeletonTable } from "@/components/account/Skeleton";
import {
  countTicketAttachments,
  fetchSupportTicket,
  replyToTicket,
  updateTicketStatus,
  uploadTicketAttachment,
  SUPPORT_ATTACHMENT_MAX_COUNT,
  TICKET_STATUS_LABELS,
  type SupportTicket,
  type TicketMessage,
} from "@/lib/api/supportTickets";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import { getStoredPermissions } from "@/lib/auth/session";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import { formatApiUtcDateTime } from "@/lib/datetime/formatUtc";
import { useTicketBreadcrumb } from "./useTicketBreadcrumb";
import TicketAttachmentField from "../TicketAttachmentField";
import TicketMessageAttachments from "../TicketMessageAttachments";
import styles from "../support-tickets.module.css";

const CHANNEL_LABELS: Record<TicketMessage["channel"], string> = {
  APP: "Mobile app",
  WEB: "Web",
  EMAIL: "Email",
  ADMIN_PORTAL: "Support portal",
};

function bubbleClass(authorType: TicketMessage["authorType"]) {
  if (authorType === "ADMIN") return `${styles.bubble} ${styles.bubbleAdmin}`;
  if (authorType === "SYSTEM") return `${styles.bubble} ${styles.bubbleSystem}`;
  return `${styles.bubble} ${styles.bubbleCustomer}`;
}

function statusClass(status: SupportTicket["status"]) {
  if (status === "RESOLVED") return `${styles.statusBadge} ${styles.statusResolved}`;
  if (status === "CLOSED") return `${styles.statusBadge} ${styles.statusClosed}`;
  return styles.statusBadge;
}

export default function SupportTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = Number(params?.id);

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const perms = useMemo(() => new Set(getStoredPermissions()), []);
  const isProvider = getAccessTokenContext().identityType === "SERVICE_PROVIDER";
  const canRead =
    perms.has("admin:support:read") || perms.has("provider:support:read");
  const canReply =
    perms.has("admin:support:update") || perms.has("provider:support:update");
  const canManageStatus = perms.has("admin:support:update");

  useTicketBreadcrumb(params?.id, ticket?.ticketNumber);

  const load = useCallback(async () => {
    if (!Number.isFinite(ticketId)) return;
    setLoading(true);
    try {
      const data = await fetchSupportTicket(ticketId);
      setTicket(data);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load this ticket." });
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    void load();
  }, [canRead, load]);

  const isTerminal =
    ticket?.status === "RESOLVED" || ticket?.status === "CLOSED";

  const attachmentSlotsLeft = Math.max(
    0,
    SUPPORT_ATTACHMENT_MAX_COUNT - countTicketAttachments(ticket ?? { messages: [] }),
  );

  async function handleReply() {
    const body = reply.trim();
    if (!body || !ticket) return;
    setSending(true);
    try {
      let updated = await replyToTicket(ticket.id, body);
      const messageId = updated.messages.at(-1)?.id;
      if (messageId != null) {
        for (const file of replyFiles) {
          updated = await uploadTicketAttachment(ticket.id, file, messageId);
        }
      }
      setTicket(updated);
      setReply("");
      setReplyFiles([]);
      toast.success(isProvider ? "Message sent." : "Reply sent to the requester.");
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not send your reply." });
    } finally {
      setSending(false);
    }
  }

  async function handleStatus(next: "RESOLVED" | "AWAITING_SUPPORT") {
    if (!ticket) return;
    setStatusUpdating(true);
    try {
      const updated = await updateTicketStatus(ticket.id, next);
      setTicket(updated);
      toast.success(
        next === "RESOLVED" ? "Ticket marked as resolved." : "Ticket reopened.",
      );
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not update the ticket status." });
    } finally {
      setStatusUpdating(false);
    }
  }

  if (!canRead) {
    return (
      <div>
        <BackLink />
        <p className={styles.note}>
          You do not have permission to view support tickets.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <BackLink />
        <SkeletonLine width="40%" />
        <SkeletonTable rows={4} cols={1} />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div>
        <BackLink />
        <p className={styles.note}>Ticket not found.</p>
      </div>
    );
  }

  return (
    <div>
      <BackLink />

      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.subject}>{ticket.subject}</h1>
          <div className={styles.metaRow}>
            <span>{ticket.ticketNumber}</span>
            <span>·</span>
            <span
              className={
                ticket.providerId == null
                  ? `${styles.originFlare} ${styles.originFlareCustomer}`
                  : `${styles.originFlare} ${styles.originFlareProvider}`
              }
              title={ticket.originLabel}
            >
              {ticket.originLabel?.trim() ||
                (ticket.providerId != null ? "Provider" : "Customer")}
            </span>
            {!isProvider ? (
              <>
                <span>·</span>
                <span>
                  {ticket.customerName?.trim() || ticket.customerEmail}
                  {ticket.customerName?.trim() ? (
                    <>
                      {" "}
                      &lt;
                      <a href={`mailto:${ticket.customerEmail}`}>
                        {ticket.customerEmail}
                      </a>
                      &gt;
                    </>
                  ) : null}
                </span>
              </>
            ) : null}
            <span>·</span>
            <span>via {ticket.source === "MOBILE" ? "Mobile app" : "Web"}</span>
            <span>·</span>
            <span>Opened {formatApiUtcDateTime(ticket.createdAt)}</span>
          </div>
        </div>

        <div className={styles.headerActions}>
          <span className={statusClass(ticket.status)}>
            {TICKET_STATUS_LABELS[ticket.status]}
          </span>
          {canManageStatus && ticket.status !== "CLOSED" ? (
            ticket.status === "RESOLVED" ? (
              <button
                type="button"
                className={styles.btnGhost}
                disabled={statusUpdating}
                onClick={() => handleStatus("AWAITING_SUPPORT")}
              >
                <RotateCcw size={16} aria-hidden />
                Reopen
              </button>
            ) : (
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={statusUpdating}
                onClick={() => handleStatus("RESOLVED")}
              >
                <CheckCircle2 size={16} aria-hidden />
                Mark resolved
              </button>
            )
          ) : null}
        </div>
      </div>

      <div className={styles.thread}>
        {ticket.messages.map((m) => (
          <div key={m.id} className={bubbleClass(m.authorType)}>
            <div className={styles.bubbleMeta}>
              <span className={styles.bubbleAuthor}>
                {m.authorType === "ADMIN"
                  ? "Support"
                  : m.authorType === "SYSTEM"
                    ? "System"
                    : m.authorEmail}
              </span>
              <span className={styles.channelTag}>{CHANNEL_LABELS[m.channel]}</span>
              <span>{formatApiUtcDateTime(m.createdAt)}</span>
            </div>
            {m.body.trim() ? <p className={styles.bubbleBody}>{m.body}</p> : null}
            <TicketMessageAttachments attachments={m.attachments ?? []} />
          </div>
        ))}
      </div>

      {!canReply ? null : isTerminal ? (
        <p className={styles.note}>
          {ticket.status === "RESOLVED"
            ? isProvider
              ? "This ticket is resolved. Contact support if you need to reopen it."
              : "This ticket is resolved. Reopen it to continue the conversation."
            : "This ticket is closed and can no longer receive replies."}
        </p>
      ) : (
        <div className={styles.replyCard}>
          <label className={styles.replyLabel} htmlFor="ticket-reply">
            {isProvider ? "Add a message" : "Reply to requester"}
          </label>
          <textarea
            id="ticket-reply"
            className={styles.replyTextarea}
            placeholder="Write your message…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            disabled={sending}
          />
          {attachmentSlotsLeft > 0 ? (
            <TicketAttachmentField
              id="reply-attachments"
              files={replyFiles}
              onChange={setReplyFiles}
              disabled={sending}
              maxCount={attachmentSlotsLeft}
            />
          ) : null}
          <div className={styles.replyActions}>
            <button
              type="button"
              className={styles.btnPrimary}
              disabled={sending || reply.trim().length === 0}
              onClick={handleReply}
            >
              <Send size={16} aria-hidden />
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/account/support-tickets" className={styles.metaRow}>
      <ArrowLeft size={16} aria-hidden /> Back to tickets
    </Link>
  );
}
