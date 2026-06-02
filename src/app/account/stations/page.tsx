"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  createStation,
  fetchStationsPage,
  type ChargingStation,
} from "@/lib/api/stations";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import Pagination from "@/components/account/Pagination";
import CreateStationModal from "@/components/account/CreateStationModal";
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
  const [adminAddress, setAdminAddress] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [imageName, setImageName] = useState("");
  const [convertingImage, setConvertingImage] = useState(false);

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

  async function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read selected image."));
      reader.readAsDataURL(file);
    });
  }

  async function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setImageBase64("");
      setImageName("");
      return;
    }
    setConvertingImage(true);
    try {
      const encoded = await toBase64(file);
      setImageBase64(encoded);
      setImageName(file.name);
    } catch {
      setImageBase64("");
      setImageName("");
      toast.error("Could not process selected image.");
    } finally {
      setConvertingImage(false);
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmedAddr = address.trim();
    const trimmedAdminAddress = adminAddress.trim();
    if (!trimmedAddr) {
      toast.error("Station address is required.");
      return;
    }
    if (!trimmedAdminAddress) {
      toast.error("Admin address is required.");
      return;
    }
    setSubmitting(true);
    try {
      const authContext = getAccessTokenContext();
      const providerId = authContext.providerId;
      const userId = authContext.userId;
      if (providerId == null && userId == null) {
        toast.error("Session context missing. Please log in again.");
        return;
      }

      await createStation({
        providerId,
        locationAddressName: trimmedAddr,
        locationLatitude: latitude.trim() || undefined,
        locationLongitude: longitude.trim() || undefined,
        adminAddress: trimmedAdminAddress,
        imageBase64: imageBase64.trim() || undefined,
      });
      toast.success("Station created");
      setAddress("");
      setLatitude("");
      setLongitude("");
      setAdminAddress("");
      setImageBase64("");
      setImageName("");
      setShowCreate(false);
      setPage(0);
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
          onClick={() => setShowCreate(true)}
        >
          New station
        </button>
        <button type="button" className={styles.button} onClick={() => void load()}>
          Refresh
        </button>
      </div>

      {showCreate ? (
        <CreateStationModal
          submitting={submitting}
          convertingImage={convertingImage}
          address={address}
          setAddress={setAddress}
          latitude={latitude}
          setLatitude={setLatitude}
          longitude={longitude}
          setLongitude={setLongitude}
          adminAddress={adminAddress}
          setAdminAddress={setAdminAddress}
          imageName={imageName}
          onImageChange={(e) => void onImageChange(e)}
          onClose={() => setShowCreate(false)}
          onSubmit={onCreate}
        />
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
                <th className={styles.th}>Provider</th>
                <th className={styles.th}>Address</th>
                <th className={styles.th}>Latitude</th>
                <th className={styles.th}>Longitude</th>
                <th className={styles.th}>Image</th>
                <th className={styles.th}>Chargers</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((s) => (
                <tr key={s.id}>
                  <td className={styles.td}>{s.stationId}</td>
                  <td className={styles.td}>{s.providerId ?? "—"}</td>
                  <td className={styles.td}>{s.locationAddressName || "—"}</td>
                  <td className={styles.td}>{s.locationLatitude || "—"}</td>
                  <td className={styles.td}>{s.locationLongitude || "—"}</td>
                  <td className={styles.td}>
                    {s.imageUrl ? (
                      <a href={s.imageUrl} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
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
