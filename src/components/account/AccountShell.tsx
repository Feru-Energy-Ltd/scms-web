"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BatteryCharging,
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Tags,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import { getRoleLabel } from "@/lib/auth/roles";
import {
  clearSession,
  getStoredIdentityType,
  getStoredPermissions,
} from "@/lib/auth/session";
import { getMenuSectionsForPermissions } from "@/lib/navigation/menu";
import {
  AccountBreadcrumbs,
  BreadcrumbProvider,
} from "@/components/account/BreadcrumbContext";
import ThemeToggleButton from "../theme/ThemeToggleButton";
import { fetchProfile, type ProfileResponse } from "@/lib/api/profile";
import styles from "./AccountShell.module.css";

const NAV_ICONS: Record<string, LucideIcon> = {
  "/account": LayoutDashboard,
  "/account/service-providers": Building2,
  "/account/permissions": Lock,
  "/account/back-office-users": Users,
  "/account/customers": Users,
  "/account/support-tickets": LifeBuoy,
  "/account/pricing": Tags,
  "/account/stations": MapPin,
  "/account/charge-boxes": BatteryCharging,
  "/account/users": User,
  "/account/invitations": Mail,
  "/account/billing": CreditCard,
  "/account/reports": BarChart3,
};

export default function AccountShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const permissions = getStoredPermissions();
  const menuSections = useMemo(
    () => getMenuSectionsForPermissions(permissions),
    [permissions],
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [identityType] = useState(() => getStoredIdentityType() || "Account");
  const [userCtx] = useState(() => getAccessTokenContext());
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  const displayName = useMemo(() => {
    if (!profile) return "User";
    if (profile.displayName?.trim()) return profile.displayName.trim();
    const fullName = [profile.firstName, profile.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || profile.email || "User";
  }, [profile]);

  const displayRole = useMemo(() => {
    if (userCtx.roles?.length) {
      // return the label of the first role
      return getRoleLabel(userCtx.roles[0]);
    }
    if (userCtx.role) return getRoleLabel(userCtx.role);
    return identityType;
  }, [userCtx.roles, userCtx.role, identityType]);

  const businessName = profile?.businessName?.trim() || null;
  const orgLabel = businessName ?? "Back Office";

  const brandMark = useMemo(() => {
    const parts = orgLabel.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return orgLabel.slice(0, 2).toUpperCase() || "BO";
  }, [orgLabel]);

  const userInitials = useMemo(() => {
    const local = displayName.split("@")[0] ?? "";
    const parts = local.split(/[._\s-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return local.slice(0, 2).toUpperCase() || "U";
  }, [displayName]);

  const allMenuItems = useMemo(
    () => menuSections.flatMap((section) => section.items),
    [menuSections],
  );

  const activeMenuUrl = useMemo(() => {
    if (!pathname) return "";
    const matched = allMenuItems
      .filter((item) => pathname === item.url || pathname.startsWith(`${item.url}/`))
      .sort((a, b) => b.url.length - a.url.length)[0];
    return matched?.url ?? "";
  }, [allMenuItems, pathname]);
  const profileNavActive = pathname === "/account/profile";

  useEffect(() => {
    let cancelled = false;

    void fetchProfile()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        // Sidebar falls back to a generic label when profile is unavailable.
      });

    return () => {
      cancelled = true;
    };
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
    <BreadcrumbProvider>
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
            <Bell size={18} aria-hidden />
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
              <CircleUserRound size={18} aria-hidden />
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
              <div className={styles.brandBlock}>
                <div className={styles.brand}>Admin Panel</div>
                <div className={styles.brandBusiness} title={orgLabel}>
                  <Building2
                    size={13}
                    className={styles.brandBusinessIcon}
                    aria-hidden
                  />
                  <span className={styles.brandBusinessText}>{orgLabel}</span>
                </div>
              </div>
              <div className={styles.brandMark} aria-hidden>
                {brandMark}
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
                {sidebarCollapsed ? (
                  <ChevronRight size={16} aria-hidden />
                ) : (
                  <ChevronLeft size={16} aria-hidden />
                )}
              </button>
            </div>

            <nav
              id="account-sidebar-nav"
              className={styles.nav}
              aria-label="Account navigation"
            >
              {menuSections.map((section) => (
                <div key={section.label} className={styles.navSection}>
                  <div className={styles.navSectionLabel}>{section.label}</div>
                  {section.items.map((item) => {
                    const NavIcon = NAV_ICONS[item.url] ?? LayoutDashboard;
                    return (
                      <Link
                        key={item.url + item.name}
                        href={item.url}
                        className={styles.navItem}
                        aria-current={
                          activeMenuUrl === item.url ? "page" : undefined
                        }
                        title={sidebarCollapsed ? item.name : undefined}
                      >
                        <NavIcon size={18} className={styles.navIcon} aria-hidden />
                        <span className={styles.navLabelFull}>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>

          <div className={styles.sidebarFooter}>
            <div className={styles.sbUser}>
              <div className={styles.sbAvatar} aria-hidden>
                {userInitials}
              </div>
              {!sidebarCollapsed && (
                <div className={styles.sbUserInfo}>
                  <div className={styles.sbUserName} title={displayName}>
                    {displayName}
                  </div>
                  <div className={styles.sbUserRole}>{displayRole}</div>
                </div>
              )}
              <button
                type="button"
                className={styles.sbLogout}
                onClick={signOut}
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={15} aria-hidden />
              </button>
            </div>
          </div>
        </aside>

        <div className={styles.main}>
          <section className={styles.content}>
            <AccountBreadcrumbs menuItems={allMenuItems} />
            {children}
          </section>
        </div>
      </div>
    </div>
    </BreadcrumbProvider>
  );
}
