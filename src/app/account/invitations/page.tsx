"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import toast from "react-hot-toast";
import DataTable, {
  type DataTableColumn,
} from "@/components/account/DataTable";
import ConfirmModal from "@/components/account/ConfirmModal";
import {
  fetchProviderInvitations,
  revokeProviderInvitation,
  resendProviderInvitation,
  sendProviderInvitation,
  type ProviderStaffRole,
} from "@/lib/api/providerInvitations";
import { asArray } from "@/lib/api/normalize";
import { formatRoleValue } from "@/lib/auth/roles";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import { parseApiUtcDateTime } from "@/lib/datetime/formatUtc";
import styles from "@/components/account/ResourceList.module.css";

type InvitationRow = Record<string, unknown>;

const PROVIDER_ROLES = [
  { value: "SERVICE_PROVIDER_OWNER" as ProviderStaffRole, label: "Owner" },
  { value: "SERVICE_PROVIDER_MANAGER" as ProviderStaffRole, label: "Manager" },
  { value: "SERVICE_PROVIDER_STAFF" as ProviderStaffRole, label: "Staff" },
] as const;

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
  const d = parseApiUtcDateTime(iso);
  return d ? d.toLocaleString() : iso;
}

export default function AccountInvitationsPage() {
  const { identityType, providerId, role } = getAccessTokenContext();
  const callerIsOwner = role === "SERVICE_PROVIDER_OWNER";
  const availableRoles = callerIsOwner
    ? PROVIDER_ROLES
    : PROVIDER_ROLES.filter((r) => r.value !== "SERVICE_PROVIDER_OWNER");
  const [rows, setRows] = useState<InvitationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [selectedRole, setSelectedRole] =
    useState<ProviderStaffRole>("SERVICE_PROVIDER_STAFF");
  const [submitting, setSubmitting] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [revokeId, setRevokeId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (identityType !== "SERVICE_PROVIDER" || providerId == null) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const raw = await fetchProviderInvitations(providerId);
      setRows(asArray(raw));
    } catch (e) {
      showApiErrorToast(e, {
        fallbackMessage: "Could not load invitations.",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [identityType, providerId]);

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
      await sendProviderInvitation(providerId!, {
        email: trimmedEmail,
        role: selectedRole,
      });
      setInviteeEmail("");
      await load();
    } catch (err) {
      showApiErrorToast(err, { fallbackMessage: "Could not send invitation." });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmRevoke = useCallback(async () => {
    if (providerId == null || revokeId == null) return;
    const id = revokeId;
    setActingId(id);
    try {
      await revokeProviderInvitation(providerId, id);
      setRevokeId(null);
      await load();
    } catch (err) {
      showApiErrorToast(err, {
        fallbackMessage: "Could not revoke invitation.",
      });
    } finally {
      setActingId(null);
    }
  }, [providerId, revokeId, load]);

  const onResend = useCallback(
    async (id: number, email: string) => {
      if (providerId == null) return;
      setResendingId(id);
      try {
        await resendProviderInvitation(providerId, id);
        toast.success(`Invitation resent to ${email}`);
        await load();
      } catch (err) {
        showApiErrorToast(err, {
          fallbackMessage: "Could not resend invitation.",
        });
      } finally {
        setResendingId(null);
      }
    },
    [providerId, load],
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
        cell: (row) => formatRoleValue(row.role ?? row.roleName),
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
          const email = cell(row, "inviteeEmail", "email");
          const canAct = status === "PENDING";
          const revoking = actingId === id;
          const resending = resendingId === id;
          return (
            <span className={styles.rowActions}>
              <button
                type="button"
                className={styles.button}
                disabled={!canAct || !Number.isFinite(id) || resending || revoking}
                onClick={() => void onResend(id, email)}
              >
                {resending ? "Sending…" : "Resend"}
              </button>
              <button
                type="button"
                className={styles.button}
                disabled={!canAct || !Number.isFinite(id) || resending || revoking}
                onClick={() => setRevokeId(id)}
              >
                Revoke
              </button>
            </span>
          );
        },
      },
    ],
    [actingId, resendingId, onResend],
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
        Invite people to join your organisation as staff. Pending invites can be
        resent or revoked before they are accepted.
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
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as ProviderStaffRole)}
        >
          {availableRoles.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
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

      {revokeId != null && (
        <ConfirmModal
          title="Revoke invitation"
          message="Revoke this invitation? The recipient will no longer be able to accept it."
          confirmLabel="Revoke"
          confirmDestructive
          loading={actingId === revokeId}
          onConfirm={() => void confirmRevoke()}
          onCancel={() => setRevokeId(null)}
        />
      )}
    </div>
  );
}
