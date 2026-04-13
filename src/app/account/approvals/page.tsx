"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DataTable, {
  type DataTableColumn,
} from "@/components/account/DataTable";
import {
  fetchPendingServiceProviders,
  setServiceProviderStatus,
} from "@/lib/api/serviceProviders";
import { asArray } from "@/lib/api/normalize";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";

type ProviderRow = Record<string, unknown>;

function cell(row: ProviderRow, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v != null && v !== "") return String(v);
  }
  return "—";
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function rowProviderId(row: ProviderRow): number {
  const idRaw = row.id;
  if (typeof idRaw === "number") return idRaw;
  if (idRaw != null) return Number(idRaw);
  return NaN;
}

export default function AccountApprovalsPage() {
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastPage, setLastPage] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await fetchPendingServiceProviders(page, size);
      setRows(asArray<ProviderRow>(raw));
      if (raw && typeof raw === "object" && "last" in raw) {
        setLastPage((raw as { last?: boolean }).last === true);
      } else {
        setLastPage(true);
      }
    } catch (e) {
      showApiErrorToast(e, {
        fallbackMessage: "Could not load pending approvals.",
      });
      setRows([]);
      setLastPage(true);
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    void load();
  }, [load]);

  const onApprove = useCallback(async (id: number) => {
    setActingId(id);
    try {
      await setServiceProviderStatus(id, "ACTIVE");
      await load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not approve provider." });
    } finally {
      setActingId(null);
    }
  }, [load]);

  const onReject = useCallback(async (id: number) => {
    if (
      !window.confirm(
        "Reject this provider? Their account will be suspended and they will be notified.",
      )
    ) {
      return;
    }
    setActingId(id);
    try {
      await setServiceProviderStatus(id, "SUSPENDED");
      await load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not reject provider." });
    } finally {
      setActingId(null);
    }
  }, [load]);

  const columns = useMemo<DataTableColumn<ProviderRow>[]>(
    () => [
      {
        id: "business",
        header: "Business",
        cell: (row) => cell(row, "businessName"),
      },
      {
        id: "owner",
        header: "Owner",
        cell: (row) => cell(row, "displayName"),
      },
      { id: "email", header: "Email", cell: (row) => cell(row, "email") },
      {
        id: "registration",
        header: "Registration",
        cell: (row) => cell(row, "registration"),
      },
      { id: "phone", header: "Phone", cell: (row) => cell(row, "phone") },
      {
        id: "submitted",
        header: "Submitted",
        cell: (row) => {
          const created = cell(row, "createdAt");
          return created !== "—" ? formatWhen(created) : "—";
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: (row) => {
          const id = rowProviderId(row);
          const busy = actingId === id;
          return (
            <div className={styles.linkRow}>
              <button
                type="button"
                className={styles.buttonPrimary}
                disabled={!Number.isFinite(id) || busy}
                onClick={() => void onApprove(id)}
              >
                Approve
              </button>
              <button
                type="button"
                className={styles.button}
                disabled={!Number.isFinite(id) || busy}
                onClick={() => void onReject(id)}
              >
                Reject
              </button>
            </div>
          );
        },
      },
    ],
    [actingId, onApprove, onReject],
  );

  return (
    <div>
      <h1 className={styles.h1}>Approvals</h1>
      <p className={styles.muted}>
        Service providers who completed email verification and are waiting for
        admin activation.
      </p>

      <div className={styles.toolbar}>
        <button type="button" className={styles.button} onClick={() => void load()}>
          Refresh
        </button>
        <button
          type="button"
          className={styles.button}
          disabled={page <= 0 || loading}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          Previous page
        </button>
        <button
          type="button"
          className={styles.button}
          disabled={lastPage || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          Next page
        </button>
        <span className={styles.muted}>Page {page + 1}</span>
      </div>

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : rows.length === 0 ? (
        <p className={styles.muted}>No pending provider approvals.</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row, i) => `${String(rowProviderId(row))}-${i}`}
        />
      )}
    </div>
  );
}
