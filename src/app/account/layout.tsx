import AccountGuard from "@/components/account/AccountGuard";
import AccountShell from "@/components/account/AccountShell";

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
