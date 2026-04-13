"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { clearSession, getStoredRole } from "@/lib/auth/session";
import { getMenuForRole } from "@/lib/navigation/menu";
import styles from "./AccountShell.module.css";

function navAbbrev(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function AccountShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const role = getStoredRole();
  const menu = getMenuForRole(role);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((c) => !c);
  }, []);

  return (
    <div
      className={`${styles.shell} ${sidebarCollapsed ? styles.shellCollapsed : ""}`}
    >
      <aside
        className={styles.sidebar}
        data-collapsed={sidebarCollapsed ? "true" : "false"}
      >
        <div className={styles.sidebarTop}>
          <div className={styles.brandRow}>
            <div className={styles.brand}>Safaricharge CMS</div>
            <div className={styles.brandMark} aria-hidden>
              SC
            </div>
            <button
              type="button"
              className={styles.collapseToggle}
              onClick={toggleSidebar}
              aria-expanded={!sidebarCollapsed}
              aria-controls="account-sidebar-nav"
              title={sidebarCollapsed ? "Expand menu" : "Collapse menu"}
            >
              <span className={styles.srOnly}>
                {sidebarCollapsed ? "Expand menu" : "Collapse menu"}
              </span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                {sidebarCollapsed ? (
                  <path d="M9 18l6-6-6-6" />
                ) : (
                  <path d="M15 18l-6-6 6-6" />
                )}
              </svg>
            </button>
          </div>

          <nav
            id="account-sidebar-nav"
            className={styles.nav}
            aria-label="Account navigation"
          >
            {menu.map((item) => (
              <Link
                key={item.url + item.name}
                href={item.url}
                className={styles.navItem}
                aria-current={pathname === item.url ? "page" : undefined}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <span className={styles.navLabelFull}>{item.name}</span>
                <span className={styles.navAbbrev}>{navAbbrev(item.name)}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className={styles.sidebarFooter}>
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
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.heading}>Account workspace</p>
          </div>
        </header>

        <section className={styles.content}>{children}</section>
      </div>
    </div>
  );
}
