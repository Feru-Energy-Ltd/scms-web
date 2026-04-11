"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  fetchPermissionDefinitions,
  fetchRoleById,
  updateRolePermissions,
} from "@/lib/api/security";
import { asArray, unwrapData } from "@/lib/api/normalize";
import { categorizePermissions } from "@/lib/security/permissionCategories";
import type { PermissionDef } from "@/lib/security/permissionCategories";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "@/components/account/ResourceList.module.css";

type RolePerm = { id: number; name: string };

function normalizeInitialPermissions(
  raw: unknown,
  defs: PermissionDef[],
): RolePerm[] {
  if (!Array.isArray(raw)) return [];
  const out: RolePerm[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const d = defs.find((x) => x.name === item);
      if (d) out.push({ id: d.id, name: d.name });
      continue;
    }
    if (item && typeof item === "object" && "id" in item) {
      const o = item as Record<string, unknown>;
      const id = Number(o.id);
      const name = typeof o.name === "string" ? o.name : "";
      if (!Number.isNaN(id)) out.push({ id, name: name || "" });
    }
  }
  const byId = new Map<number, RolePerm>();
  for (const p of out) {
    if (!byId.has(p.id)) byId.set(p.id, p);
  }
  return [...byId.values()];
}

export default function EditRolePage() {
  const params = useParams<{ roleId: string }>();
  const router = useRouter();
  const roleIdParam = params?.roleId;
  const roleIdNum = roleIdParam ? Number(roleIdParam) : NaN;

  const [roleName, setRoleName] = useState("");
  const [selected, setSelected] = useState<RolePerm[]>([]);
  const [defs, setDefs] = useState<PermissionDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!roleIdParam || Number.isNaN(roleIdNum)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [defsRaw, roleRaw] = await Promise.all([
        fetchPermissionDefinitions(),
        fetchRoleById(roleIdNum),
      ]);
      const list = asArray<Record<string, unknown>>(defsRaw).map((p) => ({
        id: Number(p.id),
        name: String(p.name ?? ""),
      })).filter((p) => !Number.isNaN(p.id) && p.name);
      setDefs(list);

      const data = unwrapData<Record<string, unknown>>(roleRaw);
      if (data) {
        setRoleName(typeof data.name === "string" ? data.name : "");
        setSelected(normalizeInitialPermissions(data.permissions, list));
      }
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load role." });
      setDefs([]);
      setSelected([]);
    } finally {
      setLoading(false);
    }
  }, [roleIdParam, roleIdNum]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => categorizePermissions(defs), [defs]);

  function togglePerm(p: PermissionDef) {
    setSelected((prev) =>
      prev.some((x) => x.id === p.id)
        ? prev.filter((x) => x.id !== p.id)
        : [...prev, { id: p.id, name: p.name }],
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roleIdParam || Number.isNaN(roleIdNum)) return;
    if (!roleName.trim() || selected.length === 0) {
      toast.error("Role name and at least one permission are required.");
      return;
    }
    setSubmitting(true);
    try {
      await updateRolePermissions({
        roleId: roleIdNum,
        name: roleName.trim(),
        permissions: selected.map((p) => ({ id: p.id, name: p.name })),
      });
      toast.success("Role updated");
      router.push("/account/permissions");
    } catch (err) {
      showApiErrorToast(err, { fallbackMessage: "Update role failed." });
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

  if (!roleIdParam || Number.isNaN(roleIdNum)) {
    return <p className={styles.error}>Invalid role id.</p>;
  }

  return (
    <div>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/account">Dashboard</Link>
        <span>/</span>
        <Link href="/account/permissions">Roles</Link>
        <span>/</span>
        <span>Edit</span>
      </nav>

      <h1 className={styles.h1}>Edit role #{roleIdNum}</h1>

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : (
        <form onSubmit={onSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="roleName">
              Role name
            </label>
            <input
              id="roleName"
              className={styles.textInput}
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
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
                          checked={selected.some((s) => s.id === p.id)}
                          onChange={() => togglePerm(p)}
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
              {submitting ? "Saving…" : "Save changes"}
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
