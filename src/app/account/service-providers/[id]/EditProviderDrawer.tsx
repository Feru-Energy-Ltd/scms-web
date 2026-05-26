"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Drawer from "@/components/account/Drawer";
import { updateProvider, type ProviderDetail } from "@/lib/api/serviceProviders";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "./provider.module.css";

export default function EditProviderDrawer({
  open,
  provider,
  onClose,
  onSaved,
}: {
  open: boolean;
  provider: ProviderDetail;
  onClose: () => void;
  onSaved: (p: ProviderDetail) => void;
}) {
  const [businessName, setBusinessName] = useState(provider.businessName ?? "");
  const [phone, setPhone] = useState(provider.phone ?? "");
  const [website, setWebsite] = useState(provider.website ?? "");
  const [address, setAddress] = useState(provider.address ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateProvider(provider.id, {
        businessName,
        phone,
        website,
        address,
      });
      toast.success("Provider updated");
      onSaved(updated);
      onClose();
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not update provider." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} title="Edit provider" onClose={onClose}>
      <div className={styles.field}>
        <label htmlFor="bn">Business name</label>
        <input id="bn" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label htmlFor="ph">Phone</label>
        <input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label htmlFor="web">Website</label>
        <input id="web" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label htmlFor="addr">Address</label>
        <input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className={styles.drawerActions}>
        <button className={styles.actionBtn} onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button className={styles.actionBtn} onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </Drawer>
  );
}
