"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable, { type DataTableColumn } from "@/components/account/DataTable";
import { SkeletonTable } from "@/components/account/Skeleton";
import Pagination from "@/components/account/Pagination";
import { fetchManagedProviders, type ProviderListItem } from "@/lib/api/serviceProviders";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "./[id]/provider.module.css";

export default function ManageProvidersPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ProviderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 5;
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pagedRows = useMemo(
    () => rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [rows, page],
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchManagedProviders();
        if (alive) setRows(data);
      } catch (e) {
        showApiErrorToast(e, { fallbackMessage: "Could not load providers." });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const columns: DataTableColumn<ProviderListItem>[] = [
    { id: "n", header: "#", cell: (_r, i) => i + 1 },
    { id: "name", header: "Business", cell: (r) => r.businessName ?? r.displayName },
    { id: "status", header: "Status", cell: (r) => r.status },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <button
          className={styles.actionBtn}
          onClick={() => router.push(`/account/service-providers/${r.id}`)}
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div>
      <h1>Manage Providers</h1>
      {loading ? (
        <SkeletonTable cols={4} />
      ) : rows.length === 0 ? (
        <p>No providers found.</p>
      ) : (
        <>
          <DataTable columns={columns} rows={pagedRows} getRowKey={(r) => r.id} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
