"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  createCustomer,
  customerDisplayName,
  fetchCustomers,
  updateCustomer,
  updateCustomerStatus,
  type CreateCustomerRequest,
  type Customer,
  type UpdateCustomerRequest,
} from "@/lib/api/customers";
import { getStoredPermissions } from "@/lib/auth/session";
import {
  getApiErrorMessage,
  showApiErrorToast,
} from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";
import DataTable, { type DataTableColumn } from "@/components/account/DataTable";
import ConfirmModal from "@/components/account/ConfirmModal";
import PageHeader from "@/components/account/PageHeader";
import RowActionsMenu from "@/components/account/RowActionsMenu";
import CreateCustomerModal from "./CreateCustomerModal";
import EditCustomerModal from "./EditCustomerModal";
import CustomerAccountsModal from "./CustomerAccountsModal";

function customerStatusLabel(enabled: boolean) {
  return enabled ? "Active" : "Inactive";
}

function CustomerStatusCell({ enabled }: Readonly<{ enabled: boolean }>) {
  return (
    <span className={enabled ? styles.badgeOk : styles.badgeNo}>
      {customerStatusLabel(enabled)}
    </span>
  );
}

function CustomerActionsCell({
  customer,
  acting,
  canEdit,
  canViewAccounts,
  canSetStatus,
  onEdit,
  onManageAccounts,
  onActivate,
  onDisable,
}: Readonly<{
  customer: Customer;
  acting: boolean;
  canEdit: boolean;
  canViewAccounts: boolean;
  canSetStatus: boolean;
  onEdit: (customer: Customer) => void;
  onManageAccounts: (customer: Customer) => void;
  onActivate: (customer: Customer) => void;
  onDisable: (customer: Customer) => void;
}>) {
  const label = customerDisplayName(customer);
  return (
    <RowActionsMenu
      label={`Actions for ${label}`}
      items={[
        {
          label: "Edit details",
          onClick: () => onEdit(customer),
          hidden: !canEdit,
          disabled: acting,
        },
        {
          label: "Manage accounts",
          onClick: () => onManageAccounts(customer),
          hidden: !canViewAccounts,
          disabled: acting,
        },
        {
          label: "Activate",
          onClick: () => onActivate(customer),
          hidden: !canSetStatus || customer.enabled,
          disabled: acting,
        },
        {
          label: "Disable",
          onClick: () => onDisable(customer),
          hidden: !canSetStatus || !customer.enabled,
          destructive: true,
          disabled: acting,
        },
      ]}
    />
  );
}

export default function CustomersManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [disableTarget, setDisableTarget] = useState<Customer | null>(null);
  const [accountsTarget, setAccountsTarget] = useState<Customer | null>(null);

  const perms = new Set(getStoredPermissions());
  const canCreate = perms.has("admin:users:update");
  const canEdit = perms.has("admin:users:update");
  const canManageAccounts = perms.has("admin:users:update");
  const canViewAccounts = perms.has("admin:users:read");
  const canSetStatus = perms.has("admin:users:delete");
  const showActions = canEdit || canManageAccounts || canViewAccounts || canSetStatus;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const page = await fetchCustomers(0, 100);
      setCustomers(page.content ?? []);
    } catch (e) {
      const message = getApiErrorMessage(e, {
        fallbackMessage: "Could not load customers.",
      });
      showApiErrorToast(e, {
        fallbackMessage: "Could not load customers.",
        toastId: "customers-load",
      });
      setCustomers([]);
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(data: CreateCustomerRequest) {
    setActing(true);
    try {
      await createCustomer(data);
      toast.success("Customer created");
      setShowCreateModal(false);
      await load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Failed to create customer." });
    } finally {
      setActing(false);
    }
  }

  async function handleUpdate(data: UpdateCustomerRequest) {
    if (!editTarget) return;
    setActing(true);
    try {
      await updateCustomer(editTarget.id, data);
      toast.success("Customer updated");
      setEditTarget(null);
      await load();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Failed to update customer." });
    } finally {
      setActing(false);
    }
  }

  async function handleSetStatus(customer: Customer, enabled: boolean) {
    setActing(true);
    try {
      await updateCustomerStatus(customer.id, enabled);
      toast.success(enabled ? "Customer activated" : "Customer disabled");
      setDisableTarget(null);
      await load();
    } catch (e) {
      showApiErrorToast(e, {
        fallbackMessage: enabled
          ? "Failed to activate customer."
          : "Failed to disable customer.",
      });
    } finally {
      setActing(false);
    }
  }

  const columns = useMemo<DataTableColumn<Customer>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: (c) => customerDisplayName(c),
      },
      { id: "email", header: "Email", cell: (c) => c.email },
      {
        id: "phone",
        header: "Phone",
        cell: (c) => c.phone?.trim() || "—",
      },
      {
        id: "status",
        header: "Status",
        cell: (c) => <CustomerStatusCell enabled={!!c.enabled} />,
      },
      ...(showActions
        ? [
            {
              id: "actions",
              header: "Actions",
              cell: (customer: Customer) => (
                <CustomerActionsCell
                  customer={customer}
                  acting={acting}
                  canEdit={canEdit}
                  canViewAccounts={canViewAccounts}
                  canSetStatus={canSetStatus}
                  onEdit={setEditTarget}
                  onManageAccounts={setAccountsTarget}
                  onActivate={(c) => void handleSetStatus(c, true)}
                  onDisable={setDisableTarget}
                />
              ),
            } satisfies DataTableColumn<Customer>,
          ]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [acting, canEdit, canManageAccounts, canSetStatus, canViewAccounts, showActions],
  );

  const tableBody = (() => {
    if (loading) return <p className={styles.muted}>Loading…</p>;
    if (customers.length === 0) return <p className={styles.muted}>No customers found.</p>;
    return (
      <DataTable
        columns={columns}
        rows={customers}
        getRowKey={(c) => c.id}
        searchable
        searchPlaceholder="Search by name, email, or phone"
        searchAccessor={(c) =>
          `${customerDisplayName(c)} ${c.email ?? ""} ${c.phone ?? ""}`
        }
        filters={[
          {
            id: "status",
            label: "Status",
            options: [
              { value: "", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
            predicate: (c, value) =>
              value === "active" ? !!c.enabled : !c.enabled,
          },
        ]}
        pageSize={10}
        emptyMessage="No customers match your search."
      />
    );
  })();

  return (
    <div>
      <PageHeader
        title="Customers"
        description={
          canCreate
            ? "Create and manage customer accounts and memberships."
            : "View customer accounts visible to you."
        }
        addLabel={canCreate ? "Create customer" : undefined}
        onAdd={canCreate ? () => setShowCreateModal(true) : undefined}
        addDisabled={acting}
      />

      {loadError && <p className={styles.error}>{loadError}</p>}

      {tableBody}

      {showCreateModal && (
        <CreateCustomerModal
          loading={acting}
          onSave={handleCreate}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {editTarget && (
        <EditCustomerModal
          customer={editTarget}
          loading={acting}
          onSave={handleUpdate}
          onCancel={() => setEditTarget(null)}
        />
      )}

      {disableTarget && (
        <ConfirmModal
          title="Disable customer"
          message={`Disable ${customerDisplayName(disableTarget)}? They will lose access until reactivated.`}
          confirmLabel="Disable"
          confirmDestructive
          loading={acting}
          onConfirm={() => void handleSetStatus(disableTarget, false)}
          onCancel={() => setDisableTarget(null)}
        />
      )}

      {accountsTarget && (
        <CustomerAccountsModal
          customer={accountsTarget}
          canManage={canManageAccounts}
          onClose={() => setAccountsTarget(null)}
        />
      )}
    </div>
  );
}
