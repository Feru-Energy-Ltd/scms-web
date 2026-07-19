"use client";

import { useEffect, useState, type FormEvent } from "react";
import Drawer from "@/components/account/Drawer";
import styles from "./support-tickets.module.css";

type Props = {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: { subject: string; message: string }) => void;
};

export default function CreateTicketDrawer({
  open,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) {
      setSubject("");
      setMessage("");
    }
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    if (!trimmedSubject || !trimmedMessage) return;
    onSubmit({ subject: trimmedSubject, message: trimmedMessage });
  }

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  const valid = subject.trim().length > 0 && message.trim().length > 0;

  return (
    <Drawer open={open} title="New support ticket" onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <p className={styles.note} style={{ marginBottom: 16 }}>
          Describe the issue and our support team will follow up on this ticket.
        </p>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="ticket-subject">
            Subject
          </label>
          <input
            id="ticket-subject"
            className={styles.formInput}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={500}
            disabled={submitting}
            required
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="ticket-message">
            Message
          </label>
          <textarea
            id="ticket-message"
            className={styles.replyTextarea}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={10000}
            disabled={submitting}
            required
          />
        </div>
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={submitting || !valid}
          >
            {submitting ? "Submitting…" : "Create ticket"}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
