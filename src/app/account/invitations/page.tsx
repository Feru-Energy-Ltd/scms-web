"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import DataTable, {
  type DataTableColumn,
} from "@/components/account/DataTable";
import {
  fetchProviderInvitations,
  revokeProviderInvitation,
  sendProviderInvitation,
  type ProviderStaffRole,
} from "@/lib/api/providerInvitations";
import { asArray } from "@/lib/api/normalize";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";

type InvitationRow = Record<string, unknown>;

const ROLE_OPTIONS: { value: ProviderStaffRole; label: string }[] = [
  { value: "PROVIDER_MANAGER", label: "Manager" },
  { value: "PROVIDER_STAFF", label: "Staff" },
  { value: "PROVIDER_OWNER", label: "Owner" },
];

function cell(row: InvitationRow, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v != null && v !== "") return String(v);
  }
  return "—";
}

function rowId(row: InvitationRow): number {
  const raw = row.id;
  if (typeof raw === "number") return raw;
  if (raw != null) return Number(raw);
  return NaN;
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default function AccountInvitationsPage() {
  const { identityType, email } = getAccessTokenContext();
  const [rows, setRows] = useState<InvitationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (identityType !== "SERVICE_PROVIDER") {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const raw = await fetchProviderInvitations(Number(inviteeEmail));
      setRows(asArray(raw));
    } catch (e) {
      showApiErrorToast(e, {
        fallbackMessage: "Could not load invitations.",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [inviteeEmail]);

  useEffect(() => {
    void load();
  }, [load]);

  const onInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (inviteeEmail == null || submitting) return;
    const trimmedEmail = inviteeEmail.trim();
    if (!trimmedEmail) return;
    setSubmitting(true);
    try {
      await sendProviderInvitation(Number(inviteeEmail), { email: trimmedEmail, role: "PROVIDER_STAFF" }); // TODO: add role selection
      setInviteeEmail("");
      await load();
    } catch (err) {
      showApiErrorToast(err, { fallbackMessage: "Could not send invitation." });
    } finally {
      setSubmitting(false);
    }
  };

  const onRevoke = useCallback(
    async (id: number) => {
      if (inviteeEmail == null) return;
      if (!window.confirm("Revoke this invitation?")) return;
      setActingId(id);
      try {
        await revokeProviderInvitation(Number(inviteeEmail), id);
        await load();
      } catch (err) {
        showApiErrorToast(err, {
          fallbackMessage: "Could not revoke invitation.",
        });
      } finally {
        setActingId(null);
      }
    },
    [inviteeEmail, load],
  );

  const columns = useMemo<DataTableColumn<InvitationRow>[]>(
    () => [
      {
        id: "email",
        header: "Email",
        cell: (row) => cell(row, "inviteeEmail", "email"),
      },
      {
        id: "role",
        header: "Role",
        cell: (row) => cell(row, "role"),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => cell(row, "status"),
      },
      {
        id: "expires",
        header: "Expires",
        cell: (row) => {
          const v = cell(row, "expiresAt");
          return v !== "—" ? formatWhen(v) : "—";
        },
      },
      {
        id: "created",
        header: "Created",
        cell: (row) => {
          const v = cell(row, "createdAt");
          return v !== "—" ? formatWhen(v) : "—";
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: (row) => {
          const id = rowId(row);
          const status = cell(row, "status");
          const canRevoke = status === "PENDING";
          const busy = actingId === id;
          return (
            <button
              type="button"
              className={styles.button}
              disabled={!canRevoke || !Number.isFinite(id) || busy}
              onClick={() => void onRevoke(id)}
            >
              Revoke
            </button>
          );
        },
      },
    ],
    [actingId, onRevoke],
  );

  if (identityType !== "SERVICE_PROVIDER") {
    return (
      <div>
        <h1 className={styles.h1}>Invitations</h1>
        <p className={styles.muted}>
          Staff invitations are only available when signed in as a service
          provider with a provider id on your access token.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className={styles.h1}>Invitations</h1>
      <p className={styles.muted}>
        Invite people to join your organisation as staff. Pending
        invites can be revoked before they are accepted.
      </p>

      <form className={styles.toolbar} onSubmit={onInvite}>
        <input
          className={styles.searchInput}
          type="email"
          required
          autoComplete="email"
          placeholder="Invitee email"
          value={inviteeEmail}
          onChange={(e) => setInviteeEmail(e.target.value)}
        />
        <select
          className={styles.searchInput}
          aria-label="Staff role"
          value="PROVIDER_STAFF" // TODO: add role selection
          onChange={(e) =>
            setInviteeEmail(e.target.value)
          }
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className={styles.buttonPrimary}
          disabled={submitting}
        >
          Send invitation
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => void load()}
        >
          Refresh
        </button>
      </form>

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : rows.length === 0 ? (
        <p className={styles.muted}>No invitations yet.</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row, i) => `${rowId(row)}-${i}`}
        />
      )}
    </div>
  );
}
