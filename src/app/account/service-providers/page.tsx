"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import DataTable, { type DataTableColumn } from "@/components/account/DataTable";
import { SkeletonTable } from "@/components/account/Skeleton";
import Pagination from "@/components/account/Pagination";
import ConfirmModal from "@/components/account/ConfirmModal";
import PageHeader from "@/components/account/PageHeader";
import RowActionsMenu from "@/components/account/RowActionsMenu";
import CreateProviderModal from "./CreateProviderModal";
import {
  createServiceProvider,
  fetchServiceProviders,
  resendProviderVerificationEmail,
  setServiceProviderStatus,
  type CreateServiceProviderRequest,
  type ProviderListItem,
} from "@/lib/api/serviceProviders";
import { getStoredPermissions } from "@/lib/auth/session";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import { formatApiUtcDateTime } from "@/lib/datetime/formatUtc";
import styles from "@/components/account/ResourceList.module.css";
import tabStyles from "@/components/account/Tabs.module.css";

const PAGE_SIZE = 10;
const FETCH_SIZE = 200;

type StatusFilter = "ALL" | "PENDING" | "ACTIVE" | "SUSPENDED";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "ACTIVE", label: "Approved" },
  { key: "SUSPENDED", label: "Suspended" },
];

function formatWhen(iso: string | null) {
  return formatApiUtcDateTime(iso);
}

function statusBadgeClass(status: ProviderListItem["status"]) {
  if (status === "ACTIVE") return styles.badgeOk;
  if (status === "PENDING") return styles.badge;
  return styles.badgeNo;
}

function statusLabel(status: ProviderListItem["status"]) {
  if (status === "ACTIVE") return "Approved";
  if (status === "PENDING") return "Pending";
  return "Suspended";
}

export default function ServiceProvidersPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<ProviderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ProviderListItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const perms = new Set(getStoredPermissions());
  const canCreate = perms.has("admin:providers:create");
  const canRead = perms.has("admin:providers:read");
  const canApprove =
    perms.has("admin:providers:activate") || perms.has("admin:providers:update");
  const canReject =
    perms.has("admin:providers:suspend") || perms.has("admin:providers:update");
  const canResend =
    perms.has("admin:providers:update") || perms.has("admin:providers:staff");
  const showActions = canApprove || canReject || canRead || canResend;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchServiceProviders({
        status: filter === "ALL" ? undefined : filter,
        size: FETCH_SIZE,
      });
      setRows(res.content ?? []);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load providers." });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const haystack = [
        r.businessName,
        r.displayName,
        r.email,
        r.phone,
        r.registration,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = useMemo(
    () => filteredRows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filteredRows, page],
  );

  async function handleCreate(data: CreateServiceProviderRequest) {
    setActing(true);
    try {
      const created = await createServiceProvider(data);
      toast.success("Service provider created");
      setShowCreateModal(false);
      setFilter("PENDING");
      setPage(0);
      await load();
      router.push(`/account/service-providers/${created.id}`);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not create provider." });
    } finally {
      setActing(false);
    }
  }

  const onApprove = useCallback(
    async (id: number) => {
      setActingId(id);
      try {
        await setServiceProviderStatus(id, "ACTIVE");
        await load();
        toast.success(
          (t) => (
            <span>
              Provider approved. Using default pricing plan.{" "}
              <a
                href={`/account/pricing?tab=assignments&assign=${id}`}
                style={{ color: "#3b82f6", fontWeight: 600 }}
                onClick={() => toast.dismiss(t.id)}
              >
                Assign custom plan →
              </a>
            </span>
          ),
          { duration: 8000 },
        );
      } catch (e) {
        showApiErrorToast(e, { fallbackMessage: "Could not approve provider." });
      } finally {
        setActingId(null);
      }
    },
    [load],
  );

  const confirmReject = useCallback(async () => {
    if (!rejectTarget) return;
    const id = rejectTarget.id;
    setActingId(id);
    try {
      await setServiceProviderStatus(id, "SUSPENDED");
      setRejectTarget(null);
      await load();
      toast.success("Provider rejected");
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not reject provider." });
    } finally {
      setActingId(null);
    }
  }, [rejectTarget, load]);

  const onResendInvite = useCallback(
    async (provider: ProviderListItem) => {
      if (!Number.isFinite(provider.userId)) return;
      setResendingId(provider.id);
      try {
        await resendProviderVerificationEmail(provider.id, provider.userId);
        toast.success(`Verification email resent to ${provider.email ?? "owner"}`);
      } catch (e) {
        showApiErrorToast(e, { fallbackMessage: "Could not resend verification email." });
      } finally {
        setResendingId(null);
      }
    },
    [],
  );

  const columns = useMemo<DataTableColumn<ProviderListItem>[]>(
    () => [
      {
        id: "business",
        header: "Business",
        cell: (r) => r.businessName ?? r.displayName ?? "—",
      },
      { id: "owner", header: "Owner", cell: (r) => r.displayName ?? "—" },
      { id: "email", header: "Email", cell: (r) => r.email ?? "—" },
      { id: "phone", header: "Phone", cell: (r) => r.phone ?? "—" },
      {
        id: "status",
        header: "Status",
        cell: (r) => (
          <span className={statusBadgeClass(r.status)}>{statusLabel(r.status)}</span>
        ),
      },
      { id: "submitted", header: "Submitted", cell: (r) => formatWhen(r.createdAt) },
      ...(showActions
        ? [
            {
              id: "actions",
              header: "Actions",
              cell: (r: ProviderListItem) => {
                const busy = actingId === r.id || acting;
                const resending = resendingId === r.id;
                const pendingInvite =
                  r.status === "PENDING" && r.emailVerified !== true;
                return (
                  <RowActionsMenu
                    label={`Actions for ${r.businessName ?? r.displayName ?? "provider"}`}
                    items={[
                      {
                        label: "View details",
                        onClick: () => router.push(`/account/service-providers/${r.id}`),
                        hidden: !canRead,
                      },
                      {
                        label: resending ? "Sending…" : "Resend invite",
                        onClick: () => void onResendInvite(r),
                        hidden: !canResend || !pendingInvite,
                        disabled: resending || busy,
                      },
                      {
                        label: busy ? "Approving…" : "Approve",
                        onClick: () => void onApprove(r.id),
                        hidden: !canApprove || r.status !== "PENDING",
                        disabled: busy || resending,
                      },
                      {
                        label: "Reject",
                        onClick: () => setRejectTarget(r),
                        hidden: !canReject || r.status !== "PENDING",
                        destructive: true,
                        disabled: busy || resending,
                      },
                    ]}
                  />
                );
              },
            } satisfies DataTableColumn<ProviderListItem>,
          ]
        : []),
    ],
    [
      acting,
      actingId,
      canApprove,
      canRead,
      canReject,
      canResend,
      onApprove,
      onResendInvite,
      resendingId,
      router,
      showActions,
    ],
  );

  return (
    <div>
      <PageHeader
        title="Service Providers"
        description="Review, create, and manage charging station operators."
        addLabel={canCreate ? "Create provider" : undefined}
        onAdd={canCreate ? () => setShowCreateModal(true) : undefined}
        addDisabled={acting}
      >
        <input
          className={styles.searchInput}
          placeholder="Search by business, owner, or email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
      </PageHeader>

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
        <SkeletonTable cols={showActions ? 7 : 6} />
      ) : filteredRows.length === 0 ? (
        <p className={styles.muted}>
          {canCreate ? "No providers found. Create one with the + button above." : "No providers found."}
        </p>
      ) : (
        <>
          <DataTable columns={columns} rows={pagedRows} getRowKey={(r) => r.id} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {showCreateModal && (
        <CreateProviderModal
          loading={acting}
          onSave={handleCreate}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {rejectTarget && (
        <ConfirmModal
          title="Reject provider"
          message={`Reject ${rejectTarget.businessName ?? rejectTarget.displayName}? Their account will be suspended and they will be notified.`}
          confirmLabel="Reject"
          confirmDestructive
          loading={actingId === rejectTarget.id}
          onConfirm={() => void confirmReject()}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}
