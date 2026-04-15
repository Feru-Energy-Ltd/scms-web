"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearSession,
  getStoredIdentityType,
  getStoredProviderName,
  getStoredRole,
} from "@/lib/auth/session";
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
  const identityType = getStoredIdentityType();
  const providerName = getStoredProviderName();
  const teamLabel = providerName || "Feru Energy Ltd";
  const menu = useMemo(
    () => getMenuForRole(role),
    [role, identityType],
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const closeUserMenu = useCallback(() => setUserMenuOpen(false), []);

  useEffect(() => {
    closeUserMenu();
  }, [pathname, closeUserMenu]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        closeUserMenu();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeUserMenu();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [userMenuOpen, closeUserMenu]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((c) => !c);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    router.push("/login");
  }, [router]);

  const { pageTitle, activeMenuUrl } = useMemo(() => {
    if (
      pathname === "/account/profile" ||
      pathname.startsWith("/account/profile/")
    ) {
      return { pageTitle: "Profile", activeMenuUrl: null as string | null };
    }
    let best: { name: string; url: string } | null = null;
    for (const item of menu) {
      if (pathname === item.url || pathname.startsWith(`${item.url}/`)) {
        if (!best || item.url.length > best.url.length) {
          best = item;
        }
      }
    }
    return {
      pageTitle: best?.name ?? "Account workspace",
      activeMenuUrl: best?.url ?? null,
    };
  }, [menu, pathname]);

  const profileNavActive =
    pathname === "/account/profile" ||
    pathname.startsWith("/account/profile/");

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
          {role ? (
            <span className={styles.topNavRole} title={role}>
              {role.replace(/^ROLE_/, "").replace(/_/g, " ")}
            </span>
          ) : null}
          <span className={styles.topNavTeam} title={teamLabel}>
            {teamLabel}
          </span>
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
