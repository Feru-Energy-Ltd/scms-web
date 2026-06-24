"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable, { type DataTableColumn } from "@/components/account/DataTable";
import { SkeletonTable } from "@/components/account/Skeleton";
import Pagination from "@/components/account/Pagination";
import PageHeader from "@/components/account/PageHeader";
import RowActionsMenu from "@/components/account/RowActionsMenu";
import {
  fetchSupportTickets,
  TICKET_STATUS_LABELS,
  type SupportTicket,
  type TicketStatus,
} from "@/lib/api/supportTickets";
import { getStoredPermissions } from "@/lib/auth/session";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import { formatApiUtcDateTime } from "@/lib/datetime/formatUtc";
import styles from "@/components/account/ResourceList.module.css";
import tabStyles from "@/components/account/Tabs.module.css";

const PAGE_SIZE = 20;

type StatusFilter = "ALL" | TicketStatus;

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "AWAITING_SUPPORT", label: "Awaiting support" },
  { key: "AWAITING_CUSTOMER", label: "Awaiting customer" },
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

  const perms = new Set(getStoredPermissions());
  const canRead = perms.has("admin:support:read");

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

  const columns = useMemo<DataTableColumn<SupportTicket>[]>(
    () => [
      {
        id: "ticketNumber",
        header: "Ticket",
        cell: (r) => <span className={styles.muted}>{r.ticketNumber}</span>,
      },
      { id: "subject", header: "Subject", cell: (r) => r.subject || "—" },
      {
        id: "customer",
        header: "Customer",
        cell: (r) => r.customerName?.trim() || r.customerEmail || "—",
      },
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
    ],
    [router],
  );

  if (!canRead) {
    return (
      <div>
        <PageHeader
          title="Support Tickets"
          description="Customer support requests and conversations."
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
        description="Review customer requests, reply, and resolve issues."
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
        <SkeletonTable cols={6} />
      ) : rows.length === 0 ? (
        <p className={styles.muted}>No tickets found.</p>
      ) : (
        <>
          <DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
