"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { fetchPermissionDefinitions, createRole } from "@/lib/api/security";
import { asArray } from "@/lib/api/normalize";
import { categorizePermissions } from "@/lib/security/permissionCategories";
import type { PermissionDef } from "@/lib/security/permissionCategories";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";

export default function CreateRolePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [defs, setDefs] = useState<PermissionDef[]>([]);
  const [loadingDefs, setLoadingDefs] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadDefs = useCallback(async () => {
    setLoadingDefs(true);
    try {
      const raw = await fetchPermissionDefinitions();
      const list = asArray<Record<string, unknown>>(raw).map((p) => ({
        id: Number(p.id),
        name: String(p.name ?? ""),
      })).filter((p) => !Number.isNaN(p.id) && p.name);
      setDefs(list);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load permissions." });
      setDefs([]);
    } finally {
      setLoadingDefs(false);
    }
  }, []);

  useEffect(() => {
    void loadDefs();
  }, [loadDefs]);

  const grouped = useMemo(() => categorizePermissions(defs), [defs]);

  function toggleName(permissionName: string) {
    setSelectedNames((prev) =>
      prev.includes(permissionName)
        ? prev.filter((n) => n !== permissionName)
        : [...prev, permissionName],
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const roleName = name.trim().toLowerCase();
    if (!roleName || selectedNames.length === 0) {
      toast.error("Role name and at least one permission are required.");
      return;
    }
    if (!/^role_[a-z]+$/.test(roleName)) {
      toast.error("Role name must be like role_operator (lowercase, role_ prefix).");
      return;
    }
    setSubmitting(true);
    try {
      await createRole({ name: roleName, permissions: selectedNames });
      toast.success("Role created");
      router.push("/account/permissions");
    } catch (err) {
      showApiErrorToast(err, { fallbackMessage: "Create role failed." });
    } finally {
      setSubmitting(false);
    }
  }

  const groupOrder: Array<keyof ReturnType<typeof categorizePermissions>> = [
    "customers",
    "chargers",
    "users",
    "rfid",
    "reports",
    "others",
  ];

  return (
    <div>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/account">Dashboard</Link>
        <span>/</span>
        <Link href="/account/permissions">Roles</Link>
        <span>/</span>
        <span>Create</span>
      </nav>

      <h1 className={styles.h1}>Create role</h1>

      {loadingDefs ? (
        <p className={styles.muted}>Loading permissions…</p>
      ) : (
        <form onSubmit={onSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="roleName">
              Role name
            </label>
            <input
              id="roleName"
              className={styles.textInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="role_operator"
              required
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Permissions</span>
            {groupOrder.map((key) => {
              const list = grouped[key];
              if (!list.length) return null;
              return (
                <div key={key} className={styles.permissionGroup}>
                  <div className={styles.permissionGroupTitle}>{key}</div>
                  <div className={styles.checkboxRow}>
                    {list.map((p) => (
                      <label key={p.id} className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          checked={selectedNames.includes(p.name)}
                          onChange={() => toggleName(p.name)}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.toolbar}>
            <button
              type="submit"
              className={styles.buttonPrimary}
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Create role"}
            </button>
            <Link href="/account/permissions" className={styles.button}>
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
