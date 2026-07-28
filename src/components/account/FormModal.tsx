"use client";

import { useEffect, useId, type ReactNode } from "react";
import modalStyles from "@/app/account/users/adminUsers.module.css";

type Props = Readonly<{
  title: string;
  loading?: boolean;
  onClose: () => void;
  children: ReactNode;
  actions: ReactNode;
  modalClassName?: string;
  subtitle?: ReactNode;
}>;

export default function FormModal({
  title,
  loading,
  onClose,
  children,
  actions,
  modalClassName,
  subtitle,
}: Props) {
  const titleId = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [loading, onClose]);

  const panelClassName = modalClassName
    ? `${modalClassName} ${modalStyles.modalRaised}`
    : `${modalStyles.modal} ${modalStyles.modalRaised}`;

  return (
    <div className={`${modalStyles.overlay} ${modalStyles.overlayLayered}`}>
      <button
        type="button"
        className={modalStyles.overlayBackdrop}
        aria-label="Close dialog"
        disabled={loading}
        onClick={onClose}
      />
      <div
        className={panelClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className={modalStyles.modalTitle}>
          {title}
        </h2>
        {subtitle}
        {children}
        <div className={modalStyles.modalActions}>{actions}</div>
      </div>
    </div>
  );
}
