"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  createCustomerAccount,
  customerDisplayName,
  fetchCustomerAccounts,
  updateCustomerAccount,
  type Customer,
  type CustomerAccount,
  type CustomerAccountStatus,
  type CustomerAccountType,
  type CreateCustomerAccountRequest,
  type UpdateCustomerAccountRequest,
} from "@/lib/api/customers";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import modalStyles from "../users/adminUsers.module.css";
import styles from "./customers.module.css";

const ACCOUNT_TYPES: CustomerAccountType[] = ["PERSONAL", "TEAM", "ENTERPRISE"];
const ACCOUNT_STATUSES: CustomerAccountStatus[] = ["ACTIVE", "SUSPENDED", "DEACTIVATED"];

interface Props {
  customer: Customer;
  canManage: boolean;
  onClose: () => void;
}

export default function CustomerAccountsModal({ customer, canManage, onClose }: Props) {
  const [accounts, setAccounts] = useState<CustomerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [editAccount, setEditAccount] = useState<CustomerAccount | null>(null);

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<CustomerAccountType>("TEAM");
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newMaxMembers, setNewMaxMembers] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchCustomerAccounts(customer.id);
      setAccounts(Array.isArray(list) ? list : []);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load accounts." });
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [customer.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setActing(true);
    try {
      const body: CreateCustomerAccountRequest = {
        name: newName.trim(),
        accountType: newType,
        businessName: newBusinessName.trim() || undefined,
        maxMembers: newMaxMembers.trim() ? Number(newMaxMembers) : undefined,
      };
      await createCustomerAccount(customer.id, body);
      toast.success("Account created");
      setNewName("");
      setNewBusinessName("");
      setNewMaxMembers("");
      await load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Failed to create account." });
    } finally {
      setActing(false);
    }
  }

  async function handleUpdate(accountId: number, body: UpdateCustomerAccountRequest) {
    setActing(true);
    try {
      await updateCustomerAccount(customer.id, accountId, body);
      toast.success("Account updated");
      setEditAccount(null);
      await load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Failed to update account." });
    } finally {
      setActing(false);
    }
  }

  const title = customerDisplayName(customer);

  return (
    <div className={modalStyles.overlay} onClick={onClose}>
      <div
        className={`${modalStyles.modal} ${styles.modalWide}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={modalStyles.modalTitle}>Customer accounts</h2>
        <p className={styles.muted}>{title} · {customer.email}</p>

        {loading ? (
          <p className={styles.muted}>Loading accounts…</p>
        ) : accounts.length === 0 ? (
          <p className={styles.muted}>No accounts yet.</p>
        ) : (
          <ul className={styles.accountList}>
            {accounts.map((account) => (
              <li key={account.id} className={styles.accountRow}>
                <div className={styles.accountMeta}>
                  <span className={styles.accountName}>{account.name}</span>
                  <span className={styles.accountSub}>
                    {account.accountType} · {account.status}
                    {account.businessName ? ` · ${account.businessName}` : ""}
                    {account.maxMembers != null ? ` · max ${account.maxMembers}` : ""}
                  </span>
                </div>
                {canManage && (
                  <button
                    type="button"
                    className={modalStyles.cancelBtn}
                    disabled={acting}
                    onClick={() => setEditAccount(account)}
                  >
                    Edit
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {canManage && !editAccount && (
          <>
            <h3 className={styles.sectionTitle}>Add account</h3>
            <div className={modalStyles.formField}>
              <label className={modalStyles.formLabel} htmlFor="new-account-name">
                Name *
              </label>
              <input
                id="new-account-name"
                className={modalStyles.formInput}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={acting}
              />
            </div>
            <div className={modalStyles.formField}>
              <label className={modalStyles.formLabel} htmlFor="new-account-type">
                Type *
              </label>
              <select
                id="new-account-type"
                className={modalStyles.formSelect}
                value={newType}
                onChange={(e) => setNewType(e.target.value as CustomerAccountType)}
                disabled={acting}
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className={modalStyles.formField}>
              <label className={modalStyles.formLabel} htmlFor="new-account-business">
                Business name
              </label>
              <input
                id="new-account-business"
                className={modalStyles.formInput}
                value={newBusinessName}
                onChange={(e) => setNewBusinessName(e.target.value)}
                disabled={acting}
              />
            </div>
            <div className={modalStyles.formField}>
              <label className={modalStyles.formLabel} htmlFor="new-account-max">
                Max members
              </label>
              <input
                id="new-account-max"
                className={modalStyles.formInput}
                type="number"
                min={1}
                value={newMaxMembers}
                onChange={(e) => setNewMaxMembers(e.target.value)}
                disabled={acting}
              />
            </div>
            <div className={modalStyles.modalActions}>
              <button
                type="button"
                className={modalStyles.primaryBtn}
                disabled={acting || !newName.trim()}
                onClick={() => void handleCreate()}
              >
                {acting ? "Saving…" : "Add account"}
              </button>
            </div>
          </>
        )}

        {editAccount && (
          <EditAccountForm
            account={editAccount}
            acting={acting}
            onCancel={() => setEditAccount(null)}
            onSave={(body) => void handleUpdate(editAccount.id, body)}
          />
        )}

        <div className={modalStyles.modalActions}>
          <button type="button" className={modalStyles.cancelBtn} onClick={onClose} disabled={acting}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function EditAccountForm({
  account,
  acting,
  onCancel,
  onSave,
}: {
  account: CustomerAccount;
  acting: boolean;
  onCancel: () => void;
  onSave: (body: UpdateCustomerAccountRequest) => void;
}) {
  const [name, setName] = useState(account.name);
  const [status, setStatus] = useState<CustomerAccountStatus>(
    (account.status as CustomerAccountStatus) || "ACTIVE",
  );
  const [businessName, setBusinessName] = useState(account.businessName ?? "");
  const [maxMembers, setMaxMembers] = useState(
    account.maxMembers != null ? String(account.maxMembers) : "",
  );

  return (
    <>
      <h3 className={styles.sectionTitle}>Edit account</h3>
      <div className={modalStyles.formField}>
        <label className={modalStyles.formLabel} htmlFor="edit-account-name">
          Name *
        </label>
        <input
          id="edit-account-name"
          className={modalStyles.formInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={acting}
        />
      </div>
      <div className={modalStyles.formField}>
        <label className={modalStyles.formLabel} htmlFor="edit-account-status">
          Status
        </label>
        <select
          id="edit-account-status"
          className={modalStyles.formSelect}
          value={status}
          onChange={(e) => setStatus(e.target.value as CustomerAccountStatus)}
          disabled={acting}
        >
          {ACCOUNT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className={modalStyles.formField}>
        <label className={modalStyles.formLabel} htmlFor="edit-account-business">
          Business name
        </label>
        <input
          id="edit-account-business"
          className={modalStyles.formInput}
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          disabled={acting}
        />
      </div>
      <div className={modalStyles.formField}>
        <label className={modalStyles.formLabel} htmlFor="edit-account-max">
          Max members
        </label>
        <input
          id="edit-account-max"
          className={modalStyles.formInput}
          type="number"
          min={1}
          value={maxMembers}
          onChange={(e) => setMaxMembers(e.target.value)}
          disabled={acting}
        />
      </div>
      <div className={modalStyles.modalActions}>
        <button type="button" className={modalStyles.cancelBtn} onClick={onCancel} disabled={acting}>
          Cancel edit
        </button>
        <button
          type="button"
          className={modalStyles.primaryBtn}
          disabled={acting || !name.trim()}
          onClick={() =>
            onSave({
              name: name.trim(),
              status,
              businessName: businessName.trim() || undefined,
              maxMembers: maxMembers.trim() ? Number(maxMembers) : undefined,
            })
          }
        >
          {acting ? "Saving…" : "Save account"}
        </button>
      </div>
    </>
  );
}
