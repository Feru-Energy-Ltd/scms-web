import type { Metadata } from "next";
import CustomersManager from "./CustomersManager";

export const metadata: Metadata = {
  title: "Customers",
};

export default function AccountCustomersPage() {
  return <CustomersManager />;
}
