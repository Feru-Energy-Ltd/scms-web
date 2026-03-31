"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getStoredRole } from "@/lib/auth/session";
import { getMenuForRole } from "@/lib/navigation/menu";
import styles from "./AccountShell.module.css";

export default function AccountShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const role = getStoredRole();
  const menu = getMenuForRole(role);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Safaricharger CMS</div>
        <nav className={styles.nav} aria-label="Account navigation">
          {menu.map((item) => (
            <Link
              key={item.url + item.name}
              href={item.url}
              className={styles.navItem}
              aria-current={pathname === item.url ? "page" : undefined}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.heading}>Account workspace</p>
            <p className={styles.role}>Role: {role ?? "unknown"}</p>
          </div>

          <button
            className={styles.logoutButton}
            type="button"
            onClick={() => {
              clearSession();
              router.push("/login");
            }}
          >
            Sign out
          </button>
        </header>

        <section className={styles.content}>{children}</section>
      </div>
    </div>
  );
}
