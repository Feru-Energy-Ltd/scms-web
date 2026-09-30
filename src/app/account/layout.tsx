import type { Metadata } from "next";
import AccountGuard from "@/components/account/AccountGuard";
import AccountShell from "@/components/account/AccountShell";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s · Safaricharge",
  },
};

export default function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AccountGuard>
      <AccountShell>{children}</AccountShell>
    </AccountGuard>
  );
}
