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
  accountType: CustomerAccountType | string;
  status: CustomerAccountStatus | string;
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

export async function fetchCustomers(
  page = 0,
  size = 50,
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
