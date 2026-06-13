"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  connectorsToDrafts,
  draftsToConnectorPayload,
  fetchChargeBoxConnectors,
  fetchChargeBoxFullDetail,
  nextConnectorId,
  replaceChargeBoxConnectors,
  updateChargeBoxInfo,
  updateChargeBoxLocation,
  updateChargeBoxSettings,
  type ChargeBoxFullDetail,
  type ConnectorSlotDraft,
  type RegistrationStatus,
} from "@/lib/api/chargeBoxes";
import { getStoredPermissions } from "@/lib/auth/session";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import listStyles from "@/components/account/ResourceList.module.css";
import formStyles from "../../create/create-charge-box.module.css";
import ConnectorsSection from "./ConnectorsSection";

function canUpdateChargers(permissions: string[]): boolean {
  const set = new Set(permissions);
  return set.has("admin:chargers:update") || set.has("provider:chargers:update");
}

function formatTimestamp(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

export default function UpdateChargeBoxPage() {
  const params = useParams<{ chargerId: string }>();
  const chargeBoxId = decodeURIComponent(params?.chargerId ?? "");
  const canEdit = useMemo(
    () => canUpdateChargers(getStoredPermissions()),
    [],
  );

  const [charger, setCharger] = useState<ChargeBoxFullDetail | null>(null);
  const [connectorSlots, setConnectorSlots] = useState<ConnectorSlotDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [registrationStatus, setRegistrationStatus] =
    useState<RegistrationStatus>("Rejected");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const applyDetail = useCallback((detail: ChargeBoxFullDetail) => {
    setCharger(detail);
    setDescription(detail.description ?? "");
    setNote(detail.note ?? "");
    setRegistrationStatus(detail.registrationStatus ?? "Rejected");
    setLatitude(detail.station?.locationLatitude ?? "");
    setLongitude(detail.station?.locationLongitude ?? "");
  }, []);

  const load = useCallback(async () => {
    if (!chargeBoxId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [detail, connectors] = await Promise.all([
        fetchChargeBoxFullDetail(chargeBoxId),
        fetchChargeBoxConnectors(chargeBoxId),
      ]);
      applyDetail(detail);
      setConnectorSlots(connectorsToDrafts(connectors));
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load charger." });
      setCharger(null);
      setConnectorSlots([]);
    } finally {
      setLoading(false);
    }
  }, [applyDetail, chargeBoxId]);

  useEffect(() => {
    void load();
  }, [load]);

  function addConnector() {
    setConnectorSlots((prev) => {
      const connectorId = nextConnectorId(prev);
      return [
        ...prev,
        {
          key: `new-${connectorId}-${Date.now()}`,
          connectorId,
          currentType: "AC",
          connectorType: "AC_TYPE2_MENNEKES",
        },
      ];
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!charger || !canEdit) return;

    if (connectorSlots.length === 0) {
      toast.error("At least one connector is required.");
      return;
    }

    const connectorIds = connectorSlots.map((slot) => slot.connectorId);
    if (new Set(connectorIds).size !== connectorIds.length) {
      toast.error("Each connector must have a unique connector id.");
      return;
    }

    setSubmitting(true);
    try {
      await Promise.all([
        updateChargeBoxInfo(chargeBoxId, {
          id: charger.id,
          description: description.trim() || undefined,
          note: note.trim() || undefined,
        }),
        updateChargeBoxLocation(chargeBoxId, {
          id: charger.id,
          latitude: latitude.trim() || undefined,
          longitude: longitude.trim() || undefined,
        }),
        updateChargeBoxSettings(chargeBoxId, {
          chargeBoxId,
          registrationStatus,
        }),
        replaceChargeBoxConnectors(
          chargeBoxId,
          draftsToConnectorPayload(connectorSlots),
        ),
      ]);
      toast.success("Charger updated");
      await load();
    } catch (err) {
      showApiErrorToast(err, { fallbackMessage: "Could not update charger." });
    } finally {
      setSubmitting(false);
    }
  }

  const regAccepted = registrationStatus === "Accepted";

  return (
    <div>
      <nav className={listStyles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/account">Dashboard</Link>
        <span>/</span>
        <Link href="/account/charge-boxes">Charge boxes</Link>
        <span>/</span>
        <span>Update</span>
      </nav>

      <h1 className={listStyles.h1}>Update charger</h1>
      <p className={listStyles.muted}>
        Charge box id: <strong>{chargeBoxId || "—"}</strong>
      </p>

      {loading ? (
        <p className={listStyles.muted}>Loading…</p>
      ) : charger == null ? (
        <p className={listStyles.error}>Charger not found or access denied.</p>
      ) : (
        <>
          <section className={formStyles.readOnlyCard} aria-label="Charger status">
            <dl className={formStyles.specGrid}>
              <div>
                <dt>Registration</dt>
                <dd>
                  <span
                    className={
                      regAccepted ? listStyles.badgeOk : listStyles.badgeNo
                    }
                  >
                    {registrationStatus}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Online</dt>
                <dd>{charger.onlineStatus ?? "—"}</dd>
              </div>
              <div>
                <dt>Station</dt>
                <dd>{charger.station?.stationId ?? "—"}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{charger.station?.locationAddressName ?? "—"}</dd>
              </div>
              <div>
                <dt>OCPP protocol</dt>
                <dd>{charger.ocppProtocol ?? "—"}</dd>
              </div>
              <div>
                <dt>Vendor / model</dt>
                <dd>
                  {[charger.chargePointVendor, charger.chargePointModel]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </dd>
              </div>
              <div>
                <dt>Firmware</dt>
                <dd>{charger.firmwareVersion ?? "—"}</dd>
              </div>
              <div>
                <dt>Last heartbeat</dt>
                <dd>{formatTimestamp(charger.lastHeartbeatTimestamp)}</dd>
              </div>
            </dl>
          </section>

          {!canEdit ? (
            <>
              <section
                className={formStyles.sectionFieldset}
                aria-label="Connectors"
              >
                <h2 className={listStyles.label}>Connectors</h2>
                <ConnectorsSection
                  canEdit={false}
                  slots={connectorSlots}
                  onChange={setConnectorSlots}
                  onAdd={addConnector}
                />
              </section>
              <p className={listStyles.muted}>
                You have read-only access. Ask an administrator or provider manager
                with charger update permission to change settings.
              </p>
            </>
          ) : (
            <form className={formStyles.form} onSubmit={onSubmit}>
              <fieldset className={formStyles.sectionFieldset}>
                <legend className={listStyles.label}>Connectors</legend>
                <ConnectorsSection
                  canEdit
                  slots={connectorSlots}
                  onChange={setConnectorSlots}
                  onAdd={addConnector}
                />
              </fieldset>

              <fieldset className={formStyles.sectionFieldset}>
                <legend className={listStyles.label}>Registration</legend>
                <p className={listStyles.muted}>
                  Set to <strong>Accepted</strong> before the physical charger can
                  connect over OCPP WebSocket.
                </p>
                <div className={listStyles.field}>
                  <label className={listStyles.label} htmlFor="registrationStatus">
                    Registration status
                  </label>
                  <select
                    id="registrationStatus"
                    className={listStyles.textInput}
                    value={registrationStatus}
                    onChange={(e) =>
                      setRegistrationStatus(e.target.value as RegistrationStatus)
                    }
                  >
                    <option value="Rejected">Rejected</option>
                    <option value="Accepted">Accepted</option>
                  </select>
                </div>
              </fieldset>

              <fieldset className={formStyles.sectionFieldset}>
                <legend className={listStyles.label}>Details</legend>
                <div className={listStyles.field}>
                  <label className={listStyles.label} htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    className={formStyles.textarea}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Internal description"
                  />
                </div>
                <div className={listStyles.field}>
                  <label className={listStyles.label} htmlFor="note">
                    Note
                  </label>
                  <textarea
                    id="note"
                    className={formStyles.textarea}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Additional notes"
                  />
                </div>
              </fieldset>

              <fieldset className={formStyles.sectionFieldset}>
                <legend className={listStyles.label}>Location</legend>
                <p className={listStyles.muted}>
                  Coordinates are stored on the linked station. Address is shown
                  above and is not editable here.
                </p>
                <div className={formStyles.row2}>
                  <div className={listStyles.field}>
                    <label className={listStyles.label} htmlFor="latitude">
                      Latitude
                    </label>
                    <input
                      id="latitude"
                      className={listStyles.textInput}
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      inputMode="decimal"
                      placeholder="-1.94"
                    />
                  </div>
                  <div className={listStyles.field}>
                    <label className={listStyles.label} htmlFor="longitude">
                      Longitude
                    </label>
                    <input
                      id="longitude"
                      className={listStyles.textInput}
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      inputMode="decimal"
                      placeholder="30.06"
                    />
                  </div>
                </div>
              </fieldset>

              <div className={formStyles.actions}>
                <button
                  type="submit"
                  className={listStyles.buttonPrimary}
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : "Save changes"}
                </button>
                <Link href="/account/charge-boxes" className={listStyles.button}>
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
