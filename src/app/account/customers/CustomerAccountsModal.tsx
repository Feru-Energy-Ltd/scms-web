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
import FormModal from "@/components/account/FormModal";
import modalStyles from "../users/adminUsers.module.css";
import styles from "./customers.module.css";
import CustomerAccountFields, {
  type CustomerAccountFormValues,
} from "./CustomerAccountFields";

type Props = Readonly<{
  customer: Customer;
  canManage: boolean;
  onClose: () => void;
}>;

function toCreateBody(values: CustomerAccountFormValues): CreateCustomerAccountRequest {
  return {
    name: values.name.trim(),
    accountType: values.accountType,
    businessName: values.businessName.trim() || undefined,
    maxMembers: values.maxMembers.trim() ? Number(values.maxMembers) : undefined,
  };
}

function toUpdateBody(values: CustomerAccountFormValues): UpdateCustomerAccountRequest {
  return {
    name: values.name.trim(),
    status: values.status,
    businessName: values.businessName.trim() || undefined,
    maxMembers: values.maxMembers.trim() ? Number(values.maxMembers) : undefined,
  };
}

export default function CustomerAccountsModal({ customer, canManage, onClose }: Props) {
  const [accounts, setAccounts] = useState<CustomerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [editAccount, setEditAccount] = useState<CustomerAccount | null>(null);

  const [newAccount, setNewAccount] = useState<CustomerAccountFormValues>({
    name: "",
    accountType: "TEAM" as CustomerAccountType,
    status: "ACTIVE" as CustomerAccountStatus,
    businessName: "",
    maxMembers: "",
  });

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
    if (!newAccount.name.trim()) return;
    setActing(true);
    try {
      await createCustomerAccount(customer.id, toCreateBody(newAccount));
      toast.success("Account created");
      setNewAccount({
        name: "",
        accountType: "TEAM",
        status: "ACTIVE",
        businessName: "",
        maxMembers: "",
      });
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

  const accountsBody = (() => {
    if (loading) return <p className={styles.muted}>Loading accounts…</p>;
    if (accounts.length === 0) return <p className={styles.muted}>No accounts yet.</p>;
    return (
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
    );
  })();

  return (
    <FormModal
      title="Customer accounts"
      loading={acting}
      onClose={onClose}
      modalClassName={`${modalStyles.modal} ${styles.modalWide}`}
      subtitle={
        <p className={styles.muted}>
          {title} · {customer.email}
        </p>
      }
      actions={
        <button type="button" className={modalStyles.cancelBtn} onClick={onClose} disabled={acting}>
          Close
        </button>
      }
    >
      {accountsBody}

      {canManage && !editAccount && (
        <>
          <h3 className={styles.sectionTitle}>Add account</h3>
          <CustomerAccountFields
            idPrefix="new-account"
            loading={acting}
            values={newAccount}
            onChange={(patch) => setNewAccount((prev) => ({ ...prev, ...patch }))}
            showType
          />
          <div className={modalStyles.modalActions}>
            <button
              type="button"
              className={modalStyles.primaryBtn}
              disabled={acting || !newAccount.name.trim()}
              onClick={() => void handleCreate()}
            >
              {acting ? "Saving…" : "Add account"}
            </button>
          </div>
        </>
      )}

      {editAccount && (
        <EditAccountForm
          key={editAccount.id}
          account={editAccount}
          acting={acting}
          onCancel={() => setEditAccount(null)}
          onSave={(body) => void handleUpdate(editAccount.id, body)}
        />
      )}
    </FormModal>
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
  const [values, setValues] = useState<CustomerAccountFormValues>({
    name: account.name,
    accountType: account.accountType,
    status: account.status || "ACTIVE",
    businessName: account.businessName ?? "",
    maxMembers: account.maxMembers != null ? String(account.maxMembers) : "",
  });

  return (
    <>
      <h3 className={styles.sectionTitle}>Edit account</h3>
      <CustomerAccountFields
        idPrefix="edit-account"
        loading={acting}
        values={values}
        onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
        showStatus
      />
      <div className={modalStyles.modalActions}>
        <button type="button" className={modalStyles.cancelBtn} onClick={onCancel} disabled={acting}>
          Cancel edit
        </button>
        <button
          type="button"
          className={modalStyles.primaryBtn}
          disabled={acting || !values.name.trim()}
          onClick={() => onSave(toUpdateBody(values))}
        >
          {acting ? "Saving…" : "Save account"}
        </button>
      </div>
    </>
  );
}
