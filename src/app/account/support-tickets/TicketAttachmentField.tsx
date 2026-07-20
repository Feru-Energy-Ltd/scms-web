"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { Paperclip, X } from "lucide-react";
import {
  SUPPORT_ATTACHMENT_ACCEPT,
  SUPPORT_ATTACHMENT_MAX_BYTES,
  SUPPORT_ATTACHMENT_MAX_COUNT,
  formatAttachmentSize,
  isImageContentType,
} from "@/lib/api/supportTickets";
import styles from "./support-tickets.module.css";

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  id?: string;
  maxCount?: number;
};

export default function TicketAttachmentField({
  files,
  onChange,
  disabled,
  id = "ticket-attachments",
  maxCount = SUPPORT_ATTACHMENT_MAX_COUNT,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrls = useMemo(
    () =>
      files.map((file) =>
        isImageContentType(file.type) ? URL.createObjectURL(file) : null,
      ),
    [files],
  );

  useEffect(
    () => () => {
      previewUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    },
    [previewUrls],
  );

  function addFiles(selected: FileList | null) {
    if (!selected?.length) return;
    const next = [...files];
    for (const file of Array.from(selected)) {
      if (next.length >= maxCount) break;
      if (file.size > SUPPORT_ATTACHMENT_MAX_BYTES) continue;
      if (next.some((f) => f.name === file.name && f.size === file.size)) continue;
      next.push(file);
    }
    onChange(next);
  }

  function removeFile(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  const atLimit = files.length >= maxCount;

  return (
    <div className={styles.formField}>
      <label className={styles.formLabel} htmlFor={id}>
        Attachments{" "}
        <span className={styles.attachmentHint}>
          (optional, up to {maxCount} file{maxCount === 1 ? "" : "s"}, 10 MB each)
        </span>
      </label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        className={styles.fileInputHidden}
        accept={SUPPORT_ATTACHMENT_ACCEPT}
        multiple
        disabled={disabled || atLimit}
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className={styles.attachButton}
        disabled={disabled || atLimit}
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip size={16} aria-hidden />
        Add files
      </button>
      {files.length > 0 ? (
        <ul className={styles.pendingAttachmentList}>
          {files.map((file, index) => {
            const previewUrl = previewUrls[index];
            return (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className={styles.pendingAttachmentItem}
              >
                {previewUrl ? (
                  <div className={styles.pendingPreviewWrap}>
                    <Image
                      src={previewUrl}
                      alt={`Preview of ${file.name}`}
                      width={220}
                      height={140}
                      className={styles.pendingPreviewImg}
                      unoptimized
                    />
                  </div>
                ) : null}
                <div className={styles.pendingAttachmentMeta}>
                  <span className={styles.pendingAttachmentName} title={file.name}>
                    {file.name}
                  </span>
                  <span className={styles.pendingAttachmentSize}>
                    {formatAttachmentSize(file.size)}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.removeAttachmentBtn}
                  disabled={disabled}
                  aria-label={`Remove ${file.name}`}
                  onClick={() => removeFile(index)}
                >
                  <X size={14} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
