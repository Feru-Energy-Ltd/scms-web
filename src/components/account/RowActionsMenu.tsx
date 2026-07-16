"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import styles from "./RowActionsMenu.module.css";

export type RowActionsMenuItem = {
  label: string;
  onClick: () => void;
  hidden?: boolean;
  disabled?: boolean;
  destructive?: boolean;
};

type MenuEntry = RowActionsMenuItem | { type: "separator" };

type Props = {
  label: string;
  items: RowActionsMenuItem[];
};

function buildMenuEntries(items: RowActionsMenuItem[]): MenuEntry[] {
  const visible = items.filter((item) => !item.hidden);
  if (visible.length === 0) return [];

  const entries: MenuEntry[] = [];
  let insertedDestructiveSeparator = false;

  for (const item of visible) {
    if (item.destructive && !insertedDestructiveSeparator) {
      const hasPriorNonDestructive = entries.some(
        (entry) => !("type" in entry),
      );
      if (hasPriorNonDestructive) {
        entries.push({ type: "separator" });
      }
      insertedDestructiveSeparator = true;
    }
    entries.push(item);
  }

  return entries;
}

export default function RowActionsMenu({ label, items }: Props) {
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const entries = buildMenuEntries(items);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  if (entries.length === 0) {
    return <span className={styles.empty}>—</span>;
  }

  function close() {
    setOpen(false);
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal size={16} aria-hidden />
      </button>
      {open ? (
        <div id={menuId} role="menu" aria-label={label} className={styles.panel}>
          {entries.map((entry, index) =>
            "type" in entry ? (
              <div key={`sep-${index}`} className={styles.separator} role="separator" />
            ) : (
              <button
                key={`${entry.label}-${index}`}
                type="button"
                role="menuitem"
                className={entry.destructive ? styles.itemDestructive : styles.item}
                disabled={entry.disabled}
                onClick={() => {
                  close();
                  entry.onClick();
                }}
              >
                {entry.label}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
