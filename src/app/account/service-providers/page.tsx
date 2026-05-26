"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import DataTable, { type DataTableColumn } from "@/components/account/DataTable";
import { SkeletonTable } from "@/components/account/Skeleton";
import Pagination from "@/components/account/Pagination";
import ConfirmModal from "@/components/account/ConfirmModal";
import {
  fetchServiceProviders,
  setServiceProviderStatus,
  type ProviderListItem,
} from "@/lib/api/serviceProviders";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";

const PAGE_SIZE = 20;

type StatusFilter = "ALL" | "PENDING" | "ACTIVE" | "SUSPENDED";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "ACTIVE", label: "Approved" },
  { key: "SUSPENDED", label: "Suspended" },
];

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default function ServiceProvidersPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<ProviderListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ProviderListItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchServiceProviders({
        status: filter === "ALL" ? undefined : filter,
        page,
        size: PAGE_SIZE,
      });
      setRows(res.content ?? []);
      setTotalPages(Math.max(1, res.totalPages));
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load providers." });
      setRows([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    void load();
  }, [load]);

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
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not reject provider." });
    } finally {
      setActingId(null);
    }
  }, [rejectTarget, load]);

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
      { id: "status", header: "Status", cell: (r) => r.status },
      { id: "submitted", header: "Submitted", cell: (r) => formatWhen(r.createdAt) },
      {
        id: "actions",
        header: "Actions",
        cell: (r) => {
          const busy = actingId === r.id;
          return (
            <div className={styles.linkRow}>
              {r.status === "PENDING" && (
                <>
                  <button
                    type="button"
                    className={styles.buttonPrimary}
                    disabled={busy}
                    onClick={() => void onApprove(r.id)}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className={styles.button}
                    disabled={busy}
                    onClick={() => setRejectTarget(r)}
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                type="button"
                className={styles.button}
                onClick={() => router.push(`/account/service-providers/${r.id}`)}
              >
                View
              </button>
            </div>
          );
        },
      },
    ],
    [actingId, onApprove, router],
  );

  return (
    <div>
      <h1 className={styles.h1}>Service Providers</h1>
      <p className={styles.muted}>
        All registered service providers. Pending providers can be approved or rejected here.
      </p>

      <div className={styles.toolbar}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={filter === f.key ? styles.buttonPrimary : styles.button}
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
        <SkeletonTable cols={7} />
      ) : rows.length === 0 ? (
        <p className={styles.muted}>No providers found.</p>
      ) : (
        <>
          <DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
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
