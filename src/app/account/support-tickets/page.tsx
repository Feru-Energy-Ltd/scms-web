"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import DataTable, { type DataTableColumn } from "@/components/account/DataTable";
import { SkeletonTable } from "@/components/account/Skeleton";
import Pagination from "@/components/account/Pagination";
import PageHeader from "@/components/account/PageHeader";
import RowActionsMenu from "@/components/account/RowActionsMenu";
import {
  createSupportTicket,
  fetchSupportTickets,
  uploadTicketAttachment,
  TICKET_STATUS_LABELS,
  type SupportTicket,
  type TicketStatus,
} from "@/lib/api/supportTickets";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import { getStoredPermissions } from "@/lib/auth/session";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import { formatApiUtcDateTime } from "@/lib/datetime/formatUtc";
import styles from "@/components/account/ResourceList.module.css";
import tabStyles from "@/components/account/Tabs.module.css";
import ticketStyles from "./support-tickets.module.css";
import CreateTicketDrawer from "./CreateTicketDrawer";

const PAGE_SIZE = 20;

type StatusFilter = "ALL" | TicketStatus;

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "AWAITING_SUPPORT", label: "Awaiting support" },
  { key: "AWAITING_CUSTOMER", label: "Awaiting reply" },
  { key: "OPEN", label: "Open" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "CLOSED", label: "Closed" },
];

function statusBadgeClass(status: TicketStatus) {
  if (status === "RESOLVED") return styles.badgeOk;
  if (status === "CLOSED") return styles.badgeNo;
  return styles.badge;
}

export default function SupportTicketsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [rows, setRows] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const perms = useMemo(() => new Set(getStoredPermissions()), []);
  const identityType = getAccessTokenContext().identityType;
  const isProvider = identityType === "SERVICE_PROVIDER";
  const isAdmin = perms.has("admin:support:read");
  const canRead = isAdmin || perms.has("provider:support:read");
  const canCreate = isProvider && perms.has("provider:support:create");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSupportTickets({
        status: filter === "ALL" ? undefined : filter,
        page,
        size: PAGE_SIZE,
      });
      setRows(res.content ?? []);
      setTotalPages(res.totalPages ?? 0);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load support tickets." });
      setRows([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    void load();
  }, [canRead, load]);

  async function handleCreate(input: {
    subject: string;
    message: string;
    files: File[];
  }) {
    try {
      const ticket = await createSupportTicket(input);
      const messageId = ticket.messages.at(-1)?.id;
      if (messageId != null) {
        for (const file of input.files) {
          await uploadTicketAttachment(ticket.id, file, messageId);
        }
      }
      toast.success("Support ticket created.");
      setCreateOpen(false);
      router.push(`/account/support-tickets/${ticket.id}`);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not create the ticket." });
    }
  }

  const columns = useMemo<DataTableColumn<SupportTicket>[]>(() => {
    const cols: DataTableColumn<SupportTicket>[] = [
      {
        id: "ticketNumber",
        header: "Ticket",
        cell: (r) => <span className={styles.muted}>{r.ticketNumber}</span>,
      },
      {
        id: "origin",
        header: "Origin",
        cell: (r) => {
          const label = r.originLabel?.trim() || (r.providerId != null ? "Provider" : "Customer");
          const isCustomer = r.providerId == null;
          return (
            <span
              className={
                isCustomer
                  ? `${ticketStyles.originFlare} ${ticketStyles.originFlareCustomer}`
                  : `${ticketStyles.originFlare} ${ticketStyles.originFlareProvider}`
              }
              title={label}
            >
              {label}
            </span>
          );
        },
      },
      { id: "subject", header: "Subject", cell: (r) => r.subject || "—" },
    ];
    if (isAdmin) {
      cols.push({
        id: "customer",
        header: "Requester",
        cell: (r) => r.customerName?.trim() || r.customerEmail || "—",
      });
    }
    cols.push(
      {
        id: "status",
        header: "Status",
        cell: (r) => (
          <span className={statusBadgeClass(r.status)}>
            {TICKET_STATUS_LABELS[r.status]}
          </span>
        ),
      },
      {
        id: "updated",
        header: "Last update",
        cell: (r) => formatApiUtcDateTime(r.updatedAt),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (r) => (
          <RowActionsMenu
            label={`Actions for ticket ${r.ticketNumber}`}
            items={[
              {
                label: "View ticket",
                onClick: () => router.push(`/account/support-tickets/${r.id}`),
              },
            ]}
          />
        ),
      },
    );
    return cols;
  }, [isAdmin, router]);

  if (!canRead) {
    return (
      <div>
        <PageHeader
          title="Support Tickets"
          description="Support requests and conversations."
        />
        <p className={styles.muted}>
          You do not have permission to view support tickets.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Support Tickets"
        description={
          isProvider
            ? "Tickets your organization opened with platform support."
            : "Review customer and provider requests, reply, and resolve issues."
        }
        addLabel={canCreate ? "New ticket" : undefined}
        onAdd={canCreate ? () => setCreateOpen(true) : undefined}
      />

      <div className={tabStyles.tabList} role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            className={filter === f.key ? tabStyles.tabActive : tabStyles.tab}
            onClick={() => {
              setFilter(f.key);
              setPage(0);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonTable cols={isAdmin ? 7 : 6} />
      ) : rows.length === 0 ? (
        <p className={styles.muted}>No tickets found.</p>
      ) : (
        <>
          <DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {createOpen ? (
        <CreateTicketDrawer
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      ) : null}
    </div>
  );
}
