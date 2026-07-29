import { apiRequestAuth, type Page } from "./http";

export type CustomerAccountType = "PERSONAL" | "TEAM" | "ENTERPRISE";
export type CustomerAccountStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export type Customer = {
  id: number;
  userId: number;
  email: string;
  displayName: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  enabled: boolean;
  createdAt: string;
};

export type CustomerAccount = {
  id: number;
  name: string;
  accountType: CustomerAccountType;
  status: CustomerAccountStatus;
  businessName: string | null;
  maxMembers: number | null;
  createdAt: string;
};

export type CreateCustomerRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  displayName?: string;
};

export type UpdateCustomerRequest = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  displayName?: string;
};

export type CreateCustomerAccountRequest = {
  name: string;
  accountType: CustomerAccountType;
  businessName?: string;
  maxMembers?: number;
};

export type UpdateCustomerAccountRequest = {
  name?: string;
  status?: CustomerAccountStatus;
  businessName?: string;
  maxMembers?: number;
};

const CUSTOMERS_PAGE_SIZE = 100;

export async function fetchCustomers(
  page = 0,
  size = CUSTOMERS_PAGE_SIZE,
  search?: string,
): Promise<Page<Customer>> {
  const q = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (search?.trim()) {
    q.set("search", search.trim());
  }
  const raw = await apiRequestAuth<Page<Customer>>(
    `/auth/management/customers?${q.toString()}`,
  );
  return {
    content: raw?.content ?? [],
    totalElements: raw?.totalElements ?? 0,
    totalPages: raw?.totalPages ?? 0,
    number: raw?.number ?? page,
  };
}

/** Loads every customer page from the management API (for client-side table filters). */
export async function fetchAllCustomers(search?: string): Promise<Customer[]> {
  const first = await fetchCustomers(0, CUSTOMERS_PAGE_SIZE, search);
  const all = [...(first.content ?? [])];
  const totalPages = first.totalPages ?? 0;
  for (let page = 1; page < totalPages; page++) {
    const next = await fetchCustomers(page, CUSTOMERS_PAGE_SIZE, search);
    all.push(...(next.content ?? []));
  }
  return all;
}

export async function fetchCustomer(id: number): Promise<Customer> {
  return apiRequestAuth<Customer>(`/auth/management/customers/${id}`);
}

export async function createCustomer(
  request: CreateCustomerRequest,
): Promise<Customer> {
  return apiRequestAuth<Customer>("/auth/management/customers", {
    method: "POST",
    body: request,
  });
}

export async function updateCustomer(
  id: number,
  request: UpdateCustomerRequest,
): Promise<Customer> {
  return apiRequestAuth<Customer>(`/auth/management/customers/${id}`, {
    method: "PUT",
    body: request,
  });
}

export async function updateCustomerStatus(id: number, enabled: boolean): Promise<void> {
  return apiRequestAuth<void>(`/auth/management/customers/${id}/status`, {
    method: "PATCH",
    body: { enabled },
  });
}

export async function fetchCustomerAccounts(customerId: number): Promise<CustomerAccount[]> {
  return apiRequestAuth<CustomerAccount[]>(
    `/auth/management/customers/${customerId}/accounts`,
  );
}

export async function createCustomerAccount(
  customerId: number,
  request: CreateCustomerAccountRequest,
): Promise<CustomerAccount> {
  return apiRequestAuth<CustomerAccount>(
    `/auth/management/customers/${customerId}/accounts`,
    { method: "POST", body: request },
  );
}

export async function updateCustomerAccount(
  customerId: number,
  accountId: number,
  request: UpdateCustomerAccountRequest,
): Promise<CustomerAccount> {
  return apiRequestAuth<CustomerAccount>(
    `/auth/management/customers/${customerId}/accounts/${accountId}`,
    { method: "PUT", body: request },
  );
}

export function customerDisplayName(customer: Customer): string {
  const display = customer.displayName?.trim();
  if (display) return display;
  const full = `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();
  return full || customer.email;
}
