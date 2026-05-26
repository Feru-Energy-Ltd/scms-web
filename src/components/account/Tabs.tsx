"use client";

import { type ReactNode, useState } from "react";
import styles from "./Tabs.module.css";

export type TabDef = { id: string; label: string; content: ReactNode };

export default function Tabs({ tabs, initialId }: { tabs: TabDef[]; initialId?: string }) {
  const [active, setActive] = useState(initialId ?? tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <div>
      <div className={styles.tabList} role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === active}
            className={t.id === active ? styles.tabActive : styles.tab}
            onClick={() => setActive(t.id)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className={styles.panel}>
        {current?.content}
      </div>
    </div>
  );
}
