"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  createStation,
  fetchStationsPage,
  type ChargingStation,
} from "@/lib/api/stations";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import Pagination from "@/components/account/Pagination";
import styles from "@/components/account/ResourceList.module.css";

export default function ChargingStationsPage() {
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchStationsPage(page, 5);
      setStations(res.content ?? []);
      setTotalPages(res.totalPages ?? 0);
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load stations." });
      setStations([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmedAddr = address.trim();
    if (!trimmedAddr) {
      toast.error("Station address is required.");
      return;
    }
    setSubmitting(true);
    try {
      await createStation({
        locationAddressName: trimmedAddr,
        locationLatitude: latitude.trim() || undefined,
        locationLongitude: longitude.trim() || undefined,
      });
      toast.success("Station created");
      setAddress("");
      setLatitude("");
      setLongitude("");
      setShowCreate(false);
      await load();
    } catch (err) {
      showApiErrorToast(err, { fallbackMessage: "Could not create station." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className={styles.h1}>Charging stations</h1>
      <p className={styles.muted}>
        Physical sites that group one or more chargeboxes. Location and ownership
        belong to the station.
      </p>

      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.buttonPrimary}
          onClick={() => setShowCreate((v) => !v)}
        >
          {showCreate ? "Close" : "New station"}
        </button>
        <button type="button" className={styles.button} onClick={() => void load()}>
          Refresh
        </button>
      </div>

      {showCreate ? (
        <form className={styles.toolbar} onSubmit={onCreate}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="stationAddress">
              Address
            </label>
            <input
              id="stationAddress"
              className={styles.textInput}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="Street, city"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="stationLat">
              Latitude (optional)
            </label>
            <input
              id="stationLat"
              className={styles.textInput}
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              inputMode="decimal"
              placeholder="-1.26"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="stationLng">
              Longitude (optional)
            </label>
            <input
              id="stationLng"
              className={styles.textInput}
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              inputMode="decimal"
              placeholder="36.80"
            />
          </div>
          <button
            type="submit"
            className={styles.buttonPrimary}
            disabled={submitting}
          >
            {submitting ? "Creating…" : "Create station"}
          </button>
        </form>
      ) : null}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : stations.length === 0 ? (
        <p className={styles.muted}>
          No charging stations yet. Create one above, or add a charger (a station
          is created automatically).
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Station id</th>
                <th className={styles.th}>Address</th>
                <th className={styles.th}>Chargers</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((s) => (
                <tr key={s.id}>
                  <td className={styles.td}>{s.stationId}</td>
                  <td className={styles.td}>{s.locationAddressName || "—"}</td>
                  <td className={styles.td}>{s.chargeBoxCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <p className={styles.muted} style={{ marginTop: 16 }}>
        Manage individual chargeboxes under{" "}
        <Link href="/account/charge-boxes">Charge Boxes</Link>.
      </p>
    </div>
  );
}
