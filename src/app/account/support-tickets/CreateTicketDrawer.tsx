"use client";

import { useRef, useState, type FormEvent } from "react";
import Drawer from "@/components/account/Drawer";
import styles from "./support-tickets.module.css";

type Props = {
  onClose: () => void;
  onSubmit: (input: {
    subject: string;
    message: string;
  }) => void | Promise<void>;
};

export default function CreateTicketDrawer({ onClose, onSubmit }: Props) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const inFlightRef = useRef(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (inFlightRef.current || pending) return;

    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    if (!trimmedSubject || !trimmedMessage) return;

    inFlightRef.current = true;
    setPending(true);
    try {
      await onSubmit({ subject: trimmedSubject, message: trimmedMessage });
    } finally {
      inFlightRef.current = false;
      setPending(false);
    }
  }

  function handleClose() {
    if (pending) return;
    onClose();
  }

  const valid = subject.trim().length > 0 && message.trim().length > 0;

  return (
    <Drawer open title="New support ticket" onClose={handleClose}>
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
            disabled={pending}
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
            disabled={pending}
            required
          />
        </div>
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={handleClose}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={pending || !valid}
          >
            {pending ? "Submitting…" : "Create ticket"}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
