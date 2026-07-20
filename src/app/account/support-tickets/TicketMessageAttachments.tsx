import Image from "next/image";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import {
  formatAttachmentSize,
  isImageContentType,
  type TicketAttachment,
} from "@/lib/api/supportTickets";
import styles from "./support-tickets.module.css";

export default function TicketMessageAttachments({
  attachments,
}: {
  attachments: TicketAttachment[];
}) {
  if (!attachments.length) return null;

  return (
    <ul className={styles.messageAttachmentList}>
      {attachments.map((a) => {
        const isImage = isImageContentType(a.contentType);
        return (
          <li key={a.id} className={styles.messageAttachmentItem}>
            {isImage ? (
              <Link
                href={a.url}
                className={styles.messageAttachmentPreviewLink}
                target="_blank"
                rel="noopener noreferrer"
                title={a.fileName}
              >
                <Image
                  src={a.url}
                  alt={a.fileName}
                  width={220}
                  height={140}
                  className={styles.messageAttachmentPreviewImg}
                  unoptimized
                />
              </Link>
            ) : (
              <Link
                href={a.url}
                className={styles.attachmentLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {a.contentType === "application/pdf" ? (
                  <FileText size={16} aria-hidden />
                ) : (
                  <Download size={16} aria-hidden />
                )}
                <span className={styles.attachmentName}>{a.fileName}</span>
                {a.sizeBytes != null ? (
                  <span className={styles.attachmentSize}>
                    {formatAttachmentSize(a.sizeBytes)}
                  </span>
                ) : null}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
