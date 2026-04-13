"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import {
  CHARGE_BOX_CONNECTOR_TYPES,
  createChargeBox,
  type CreateChargeBoxPayload,
} from "@/lib/api/chargingStations";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import listStyles from "@/components/account/ResourceList.module.css";
import styles from "./create-charge-box.module.css";

type ConnectorSlot = {
  currentType: "AC" | "DC";
  connectorType: (typeof CHARGE_BOX_CONNECTOR_TYPES)[number];
};

const OCPP_OPTIONS = ["OCPP_J16", "OCPP_J20", "OCPP_J21"] as const;

export default function CreateChargeBoxPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [chargeBoxId, setChargeBoxId] = useState("");
  const [idTag, setIdTag] = useState("");
  const [locationAddressName, setLocationAddressName] = useState("");
  const [locationLatitude, setLocationLatitude] = useState("");
  const [locationLongitude, setLocationLongitude] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"HOME" | "PUBLIC">("PUBLIC");
  const [currentType, setCurrentType] = useState<
    "AC" | "DC" | "DUAL_CHARGER"
  >("AC");
  const [ocppProtocol, setOcppProtocol] =
    useState<(typeof OCPP_OPTIONS)[number]>("OCPP_J16");
  const [numConnectors, setNumConnectors] = useState(1);
  const [connectorSlots, setConnectorSlots] = useState<ConnectorSlot[]>([
    { currentType: "AC", connectorType: "AC_TYPE2_MENNEKES" },
  ]);
  const [imageDataUrl, setImageDataUrl] = useState("");

  const setConnectorCount = useCallback((raw: number) => {
    const n = Math.max(1, Math.min(8, Math.floor(raw) || 1));
    setNumConnectors(n);
    setConnectorSlots((prev) => {
      const next = prev.slice(0, n);
      while (next.length < n) {
        next.push({ currentType: "AC", connectorType: "AC_TYPE2_MENNEKES" });
      }
      return next;
    });
  }, []);

  const patchSlot = useCallback(
    (index: number, patch: Partial<ConnectorSlot>) => {
      setConnectorSlots((prev) =>
        prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
      );
    },
    [],
  );

  function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setImageDataUrl("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (PNG, JPEG, etc.).");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = chargeBoxId.trim();
    const addr = locationAddressName.trim();
    const tag = idTag.trim();

    if (!id || !addr || !tag) {
      toast.error("Charge box id, address, and id tag are required.");
      return;
    }
    if (!imageDataUrl.startsWith("data:image/")) {
      toast.error("Please upload a station image (required by the server).");
      return;
    }
    if (connectorSlots.length !== numConnectors) {
      toast.error("Connector rows must match the number of connectors.");
      return;
    }

    const payload: CreateChargeBoxPayload = {
      chargeBoxId: id,
      ocppProtocol,
      description: description.trim() || undefined,
      locationLatitude: locationLatitude.trim() || undefined,
      locationLongitude: locationLongitude.trim() || undefined,
      locationAddressName: addr,
      currentType,
      numberOfConnectors: numConnectors,
      connectors: connectorSlots.map((s, i) => ({
        connectorId: i + 1,
        currentType: s.currentType,
        connectorType: s.connectorType,
      })),
      type,
      imageBase64: imageDataUrl,
      idTag: tag,
    };

    setSubmitting(true);
    try {
      await createChargeBox(payload);
      toast.success("Charger created");
      router.push(`/account/charge-boxes/update/${encodeURIComponent(id)}`);
    } catch (err) {
      showApiErrorToast(err, { fallbackMessage: "Could not create charger." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <nav className={listStyles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/account">Dashboard</Link>
        <span>/</span>
        <Link href="/account/charge-boxes">Charge boxes</Link>
        <span>/</span>
        <span>Create</span>
      </nav>

      <h1 className={listStyles.h1}>New charger</h1>
      <p className={listStyles.muted}>
        Register a charge box. You need permission{" "}
        <code className={styles.code}>CREATE_CHARGER</code> and a valid station
        photo (<code className={styles.code}>data:image/…</code> upload).
      </p>

      <form className={styles.form} onSubmit={onSubmit}>
        <div className={listStyles.field}>
          <label className={listStyles.label} htmlFor="chargeBoxId">
            Charge box id
          </label>
          <input
            id="chargeBoxId"
            className={listStyles.textInput}
            value={chargeBoxId}
            onChange={(e) => setChargeBoxId(e.target.value)}
            required
            autoComplete="off"
            placeholder="e.g. CP-001"
          />
        </div>

        <div className={listStyles.field}>
          <label className={listStyles.label} htmlFor="idTag">
            Id tag (RFID / identifier)
          </label>
          <input
            id="idTag"
            className={listStyles.textInput}
            value={idTag}
            onChange={(e) => setIdTag(e.target.value)}
            required
            autoComplete="off"
          />
        </div>

        <div className={listStyles.field}>
          <label className={listStyles.label} htmlFor="locationAddressName">
            Location address
          </label>
          <input
            id="locationAddressName"
            className={listStyles.textInput}
            value={locationAddressName}
            onChange={(e) => setLocationAddressName(e.target.value)}
            required
            placeholder="Street, city"
          />
        </div>

        <div className={styles.row2}>
          <div className={listStyles.field}>
            <label className={listStyles.label} htmlFor="locationLatitude">
              Latitude (optional)
            </label>
            <input
              id="locationLatitude"
              className={listStyles.textInput}
              value={locationLatitude}
              onChange={(e) => setLocationLatitude(e.target.value)}
              inputMode="decimal"
              placeholder="-1.94"
            />
          </div>
          <div className={listStyles.field}>
            <label className={listStyles.label} htmlFor="locationLongitude">
              Longitude (optional)
            </label>
            <input
              id="locationLongitude"
              className={listStyles.textInput}
              value={locationLongitude}
              onChange={(e) => setLocationLongitude(e.target.value)}
              inputMode="decimal"
              placeholder="30.06"
            />
          </div>
        </div>

        <div className={listStyles.field}>
          <label className={listStyles.label} htmlFor="description">
            Description (optional)
          </label>
          <textarea
            id="description"
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Notes shown internally"
          />
        </div>

        <div className={styles.row2}>
          <div className={listStyles.field}>
            <label className={listStyles.label} htmlFor="type">
              Charger type
            </label>
            <select
              id="type"
              className={listStyles.textInput}
              value={type}
              onChange={(e) =>
                setType(e.target.value as "HOME" | "PUBLIC")
              }
            >
              <option value="PUBLIC">PUBLIC</option>
              <option value="HOME">HOME</option>
            </select>
          </div>
          <div className={listStyles.field}>
            <label className={listStyles.label} htmlFor="currentType">
              Current type
            </label>
            <select
              id="currentType"
              className={listStyles.textInput}
              value={currentType}
              onChange={(e) =>
                setCurrentType(
                  e.target.value as "AC" | "DC" | "DUAL_CHARGER",
                )
              }
            >
              <option value="AC">AC</option>
              <option value="DC">DC</option>
              <option value="DUAL_CHARGER">DUAL_CHARGER</option>
            </select>
          </div>
        </div>

        <div className={listStyles.field}>
          <label className={listStyles.label} htmlFor="ocppProtocol">
            OCPP protocol
          </label>
          <select
            id="ocppProtocol"
            className={listStyles.textInput}
            value={ocppProtocol}
            onChange={(e) =>
              setOcppProtocol(e.target.value as (typeof OCPP_OPTIONS)[number])
            }
          >
            {OCPP_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className={listStyles.field}>
          <label className={listStyles.label} htmlFor="numConnectors">
            Number of connectors
          </label>
          <input
            id="numConnectors"
            type="number"
            min={1}
            max={8}
            className={listStyles.textInput}
            style={{ maxWidth: 120 }}
            value={numConnectors}
            onChange={(e) => setConnectorCount(Number(e.target.value))}
            required
          />
        </div>

        <fieldset className={styles.connectorFieldset}>
          <legend className={listStyles.label}>Connectors</legend>
          <p className={listStyles.muted}>
            Each row maps to <code className={styles.code}>connectorId</code>{" "}
            1…n. Types must exist in the system catalog.
          </p>
          <div className={styles.connectorList}>
            {connectorSlots.map((slot, i) => (
              <div key={i} className={styles.connectorCard}>
                <span className={styles.connectorIndex}>#{i + 1}</span>
                <select
                  className={listStyles.textInput}
                  aria-label={`Connector ${i + 1} current`}
                  value={slot.currentType}
                  onChange={(e) =>
                    patchSlot(i, {
                      currentType: e.target.value as "AC" | "DC",
                    })
                  }
                >
                  <option value="AC">AC</option>
                  <option value="DC">DC</option>
                </select>
                <select
                  className={listStyles.textInput}
                  aria-label={`Connector ${i + 1} plug type`}
                  value={slot.connectorType}
                  onChange={(e) =>
                    patchSlot(i, {
                      connectorType: e.target
                        .value as ConnectorSlot["connectorType"],
                    })
                  }
                >
                  {CHARGE_BOX_CONNECTOR_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </fieldset>

        <div className={listStyles.field}>
          <label className={listStyles.label} htmlFor="image">
            Station image
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={onImageChange}
            required
          />
          {imageDataUrl ? (
            <div className={styles.previewWrap}>
              <Image
                src={imageDataUrl}
                alt="Preview"
                width={220}
                height={140}
                className={styles.previewImg}
                unoptimized
              />
            </div>
          ) : null}
        </div>

        <div className={styles.actions}>
          <button
            type="submit"
            className={listStyles.buttonPrimary}
            disabled={submitting}
          >
            {submitting ? "Creating…" : "Create charger"}
          </button>
          <Link href="/account/charge-boxes" className={listStyles.button}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
