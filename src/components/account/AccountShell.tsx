"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearSession,
  getStoredIdentityType,
  getStoredRoleCode
} from "@/lib/auth/session";
import { getMenuForRoleCode } from "@/lib/navigation/menu";
import ThemeToggleButton from "../theme/ThemeToggleButton";
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
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [identityType, setIdentityType] = useState("Account");
  const roleCode = getStoredRoleCode();
// TODO: get role code from JWT
  const menu = useMemo(() => getMenuForRoleCode(roleCode ?? ""), [roleCode]);
  const activeMenuUrl = useMemo(() => {
    if (!pathname) return "";
    const matched = menu
      .filter((item) => pathname === item.url || pathname.startsWith(`${item.url}/`))
      .sort((a, b) => b.url.length - a.url.length)[0];
    return matched?.url ?? "";
  }, [menu, pathname]);
  const profileNavActive = pathname === "/account/profile";

  useEffect(() => {
    const storedIdentityType = getStoredIdentityType();
    if (storedIdentityType) {
      setIdentityType(storedIdentityType);
    }
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  function closeUserMenu() {
    setUserMenuOpen(false);
  }

  function toggleSidebar() {
    setSidebarCollapsed((current) => !current);
  }

  function signOut() {
    clearSession();
    router.push("/");
  }

  return (
    <div className={styles.root}>
      <header className={styles.topNav}>
        <Link href="/account" className={styles.topNavHome}>
          <Image
            src="/assets/logo.png"
            alt=""
            width={112}
            height={40}
            className={styles.topNavLogo}
            priority
          />
          <span className={styles.topNavBrand}>Safaricharge CMS</span>
        </Link>
        <div className={styles.topNavRight}>
          <ThemeToggleButton className={styles.topNavMenuTrigger} />
          <button
            type="button"
            className={styles.topNavMenuTrigger}
            aria-label="Notifications"
            title="Notifications"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <div className={styles.topNavMenuWrap} ref={userMenuRef}>
            <button
              type="button"
              id="account-user-menu-button"
              className={styles.topNavMenuTrigger}
              aria-label="Account menu"
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              aria-controls="account-user-menu"
              data-active={profileNavActive ? "true" : undefined}
              onClick={() => setUserMenuOpen((open) => !open)}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
            {userMenuOpen ? (
              <div
                id="account-user-menu"
                role="menu"
                aria-labelledby="account-user-menu-button"
                className={styles.topNavMenuPanel}
              >
                <div className={styles.topNavMenuMeta}>
                  <p className={styles.topNavMenuMetaTitle}>{identityType}</p>
                </div>
                <Link
                  href="/account/profile"
                  role="menuitem"
                  className={styles.topNavMenuItem}
                  onClick={closeUserMenu}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className={styles.topNavMenuItem}
                  onClick={closeUserMenu}
                >
                  Notifications
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={styles.topNavMenuItem}
                  onClick={closeUserMenu}
                >
                  Help
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={styles.topNavMenuItem}
                  onClick={closeUserMenu}
                >
                  Settings
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={`${styles.topNavMenuItem} ${styles.topNavMenuItemSignOut}`}
                  onClick={() => {
                    closeUserMenu();
                    signOut();
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div
        className={`${styles.shell} ${sidebarCollapsed ? styles.shellCollapsed : ""}`}
      >
        <aside
          className={styles.sidebar}
          data-collapsed={sidebarCollapsed ? "true" : "false"}
        >
          <div className={styles.sidebarTop}>
            <div className={styles.brandRow}>
              <div className={styles.brand}>Admin Panel</div>
              <div className={styles.brandMark} aria-hidden>
                AP
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
                  aria-current={
                    activeMenuUrl === item.url ? "page" : undefined
                  }
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
              onClick={signOut}
            >
              Sign out
            </button>
          </div>
        </aside>

        <div className={styles.main}>
          <section className={styles.content}>{children}</section>
        </div>
      </div>
    </div>
  );
}
