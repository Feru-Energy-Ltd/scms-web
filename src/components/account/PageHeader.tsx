import Link from "next/link";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./PageHeader.module.css";

type AddIconButtonProps = {
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

export function AddIconButton({
  label,
  href,
  onClick,
  disabled,
}: AddIconButtonProps) {
  if (href) {
    return (
      <Link
        href={href}
        className={styles.addButton}
        aria-label={label}
        title={label}
      >
        <Plus size={18} aria-hidden />
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={styles.addButton}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <Plus size={18} aria-hidden />
    </button>
  );
}

type PageHeaderProps = {
  title: string;
  description?: string;
  addLabel?: string;
  addHref?: string;
  onAdd?: () => void;
  addDisabled?: boolean;
  children?: ReactNode;
};

export default function PageHeader({
  title,
  description,
  addLabel,
  addHref,
  onAdd,
  addDisabled,
  children,
}: PageHeaderProps) {
  const showAdd = addHref != null || onAdd != null;

  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <div className={styles.text}>
          <h1 className={styles.title}>{title}</h1>
          {description ? (
            <p className={styles.description}>{description}</p>
          ) : null}
        </div>
        {showAdd && addLabel ? (
          <AddIconButton
            label={addLabel}
            href={addHref}
            onClick={onAdd}
            disabled={addDisabled}
          />
        ) : null}
      </div>
      {children ? <div className={styles.toolbar}>{children}</div> : null}
    </header>
  );
}
