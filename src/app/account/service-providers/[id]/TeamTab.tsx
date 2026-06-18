"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import DataTable, { type DataTableColumn } from "@/components/account/DataTable";
import { SkeletonTable } from "@/components/account/Skeleton";
import ConfirmModal from "@/components/account/ConfirmModal";
import Pagination from "@/components/account/Pagination";
import RowActionsMenu from "@/components/account/RowActionsMenu";
import {
  fetchProviderStaffAdmin,
  fetchProviderStaffInvitationsAdmin,
  updateProviderStaffAdmin,
  suspendProviderStaffAdmin,
  activateProviderStaffAdmin,
  resendProviderStaffInvitationAdmin,
  resendStaffVerificationEmailAdmin,
  type AdminStaffInvitation,
  type AdminStaffMember,
} from "@/lib/api/serviceProviders";
import { requestPasswordReset } from "@/lib/api/auth";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import { getStoredPermissions } from "@/lib/auth/session";
import { formatApiUtcDateTime } from "@/lib/datetime/formatUtc";
import styles from "./provider.module.css";

const ROLES = ["SERVICE_PROVIDER_OWNER", "SERVICE_PROVIDER_MANAGER", "SERVICE_PROVIDER_STAFF"];

function formatRole(role: string) {
  return role.replace("SERVICE_PROVIDER_", "");
}

function formatWhen(iso: string) {
  const d = formatApiUtcDateTime(iso);
  return d ? d.toLocaleString() : iso;
}

export default function TeamTab({ providerId }: { providerId: number }) {
  const [rows, setRows] = useState<AdminStaffMember[]>([]);
  const [invitations, setInvitations] = useState<AdminStaffInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [suspendTarget, setSuspendTarget] = useState<AdminStaffMember | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<AdminStaffMember | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendingUserId, setResendingUserId] = useState<number | null>(null);
  const [resettingUserId, setResettingUserId] = useState<number | null>(null);
  const [resendingInvitationId, setResendingInvitationId] = useState<number | null>(null);

  const canManage = getStoredPermissions().includes("admin:providers:staff");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, invitationRes] = await Promise.all([
        fetchProviderStaffAdmin(providerId, page, 5),
        canManage ? fetchProviderStaffInvitationsAdmin(providerId) : Promise.resolve([]),
      ]);
      setRows(staffRes.content ?? []);
      setTotalPages(staffRes.totalPages ?? 0);
      setInvitations(invitationRes);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load team members." });
      setRows([]);
      setTotalPages(0);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, [providerId, page, canManage]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [providerId]);

  const changeRole = async (m: AdminStaffMember, role: string) => {
    if (role === m.role) return;
    try {
      await updateProviderStaffAdmin(providerId, m.userId, role);
      toast.success("Role updated");
      void load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not change role." });
    }
  };

  const applySuspend = async () => {
    if (!suspendTarget) return;
    setBusy(true);
    try {
      await suspendProviderStaffAdmin(providerId, suspendTarget.userId);
      toast.success("Member disabled");
      setSuspendTarget(null);
      void load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not disable member." });
    } finally {
      setBusy(false);
    }
  };

  const activate = async (m: AdminStaffMember) => {
    try {
      await activateProviderStaffAdmin(providerId, m.userId);
      toast.success("Member activated");
      void load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not activate member." });
    }
  };

  const applyResetPassword = async () => {
    if (!resetPasswordTarget) return;
    setBusy(true);
    setResettingUserId(resetPasswordTarget.userId);
    try {
      await requestPasswordReset(resetPasswordTarget.email);
      toast.success(`Password reset email sent to ${resetPasswordTarget.email}`);
      setResetPasswordTarget(null);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not send password reset email." });
    } finally {
      setBusy(false);
      setResettingUserId(null);
    }
  };

  const resendVerificationEmail = async (m: AdminStaffMember) => {
    setResendingUserId(m.userId);
    try {
      await resendStaffVerificationEmailAdmin(providerId, m.userId);
      toast.success(`Verification email sent to ${m.email}`);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not resend verification email." });
    } finally {
      setResendingUserId(null);
    }
  };

  const resendInvitation = async (invitation: AdminStaffInvitation) => {
    setResendingInvitationId(invitation.id);
    try {
      await resendProviderStaffInvitationAdmin(providerId, invitation.id);
      toast.success(`Invitation resent to ${invitation.inviteeEmail}`);
      void load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not resend invitation." });
    } finally {
      setResendingInvitationId(null);
    }
  };

  const columns: DataTableColumn<AdminStaffMember>[] = [
    { id: "n", header: "#", cell: (_r, i) => i + 1 },
    { id: "name", header: "Full Name", cell: (r) => r.displayName },
    { id: "email", header: "Email", cell: (r) => r.email },
    {
      id: "role",
      header: "Role",
      cell: (r) =>
        canManage ? (
          <select
            className={styles.control}
            value={r.role}
            onChange={(e) => changeRole(r, e.target.value)}
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {formatRole(role)}
              </option>
            ))}
          </select>
        ) : (
          formatRole(r.role)
        ),
    },
    {
      id: "status",
      header: "Status",
      cell: (r) => (r.emailVerified === false ? "Unverified" : r.status),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (r) => {
        if (!canManage) return null;
        const resending = resendingUserId === r.userId;
        const resetting = resettingUserId === r.userId;
        return (
          <RowActionsMenu
            label={`Actions for ${r.displayName}`}
            items={[
              {
                label: resending ? "Sending…" : "Resend verification email",
                onClick: () => void resendVerificationEmail(r),
                hidden: r.emailVerified !== false,
                disabled: resending,
              },
              {
                label: resetting ? "Sending…" : "Reset password",
                onClick: () => setResetPasswordTarget(r),
                disabled: resetting,
              },
              {
                label: "Activate",
                onClick: () => void activate(r),
                hidden: r.status === "ACTIVE",
              },
              {
                label: "Disable member",
                onClick: () => setSuspendTarget(r),
                destructive: true,
                hidden: r.status !== "ACTIVE",
              },
            ]}
          />
        );
      },
    },
  ];

  const invitationColumns: DataTableColumn<AdminStaffInvitation>[] = [
    { id: "email", header: "Email", cell: (r) => r.inviteeEmail },
    { id: "role", header: "Role", cell: (r) => formatRole(r.role) },
    { id: "status", header: "Status", cell: (r) => r.status },
    { id: "expires", header: "Expires", cell: (r) => formatWhen(r.expiresAt) },
    {
      id: "actions",
      header: "Actions",
      cell: (r) => {
        if (!canManage || r.status !== "PENDING") return null;
        const resending = resendingInvitationId === r.id;
        return (
          <RowActionsMenu
            label={`Actions for ${r.inviteeEmail}`}
            items={[
              {
                label: resending ? "Sending…" : "Resend invitation",
                onClick: () => void resendInvitation(r),
                disabled: resending,
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <div>
      {loading ? (
        <SkeletonTable cols={6} />
      ) : rows.length === 0 ? (
        <p>No team members found.</p>
      ) : (
        <>
          <DataTable columns={columns} rows={rows} getRowKey={(r) => r.userId} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {canManage && !loading && invitations.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Pending invitations</h3>
          <DataTable
            columns={invitationColumns}
            rows={invitations}
            getRowKey={(r) => r.id}
          />
        </div>
      )}

      {suspendTarget && (
        <ConfirmModal
          title="Disable member"
          message={`Disable ${suspendTarget.displayName}'s access?`}
          confirmLabel="Disable"
          confirmDestructive
          loading={busy}
          onConfirm={applySuspend}
          onCancel={() => setSuspendTarget(null)}
        />
      )}

      {resetPasswordTarget && (
        <ConfirmModal
          title="Reset password"
          message={`Send a password reset link to ${resetPasswordTarget.email}?`}
          confirmLabel="Send reset link"
          loading={busy}
          onConfirm={applyResetPassword}
          onCancel={() => setResetPasswordTarget(null)}
        />
      )}
    </div>
  );
}
