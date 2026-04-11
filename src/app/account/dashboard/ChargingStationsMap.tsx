"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchChargingStations } from "@/lib/api/chargingStations";
import { asArray } from "@/lib/api/normalize";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "./dashboard-map.module.css";

type ChargerRow = Record<string, unknown>;

const DEFAULT_CENTER: [number, number] = [-1.9441, 30.0619];
const FETCH_SIZE = 200;

function cell(row: ChargerRow, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v != null && v !== "") return String(v);
  }
  return "";
}

function parseCoord(row: ChargerRow, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 14);
      return;
    }
    const bounds = L.latLngBounds(
      positions.map((p) => L.latLng(p[0], p[1])),
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  }, [map, positions]);

  return null;
}

export default function ChargingStationsMap() {
  const [rows, setRows] = useState<ChargerRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await fetchChargingStations(0, FETCH_SIZE);
      setRows(asArray<ChargerRow>(raw));
    } catch (e) {
      showApiErrorToast(e, { fallbackMessage: "Could not load stations for the map." });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markers = useMemo(() => {
    const out: {
      key: string;
      id: string;
      lat: number;
      lng: number;
      address: string;
    }[] = [];

    rows.forEach((row, i) => {
      const lat = parseCoord(row, "locationLatitude", "latitude");
      const lng = parseCoord(row, "locationLongitude", "longitude");
      if (lat == null || lng == null) return;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

      const id =
        cell(row, "chargeBoxId", "id", "chargerId") || `row-${i}`;
      const address = cell(row, "address");
      out.push({
        key: `${id}-${lat}-${lng}-${i}`,
        id,
        lat,
        lng,
        address,
      });
    });

    return out;
  }, [rows]);

  const positions = useMemo(
    () => markers.map((m) => [m.lat, m.lng] as [number, number]),
    [markers],
  );

  return (
    <>
      <div className={styles.toolbar}>
        <button type="button" className={styles.refresh} onClick={() => void load()}>
          Refresh
        </button>
        <span className={styles.hint}>
          {loading
            ? "Loading stations…"
            : `${markers.length} on map · ${rows.length} loaded (up to ${FETCH_SIZE})`}
        </span>
      </div>

      <div className={styles.mapWrap}>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={12}
          className={styles.map}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {positions.length > 0 ? <FitBounds positions={positions} /> : null}
          {markers.map((m) => (
            <CircleMarker
              key={m.key}
              center={[m.lat, m.lng]}
              radius={9}
              pathOptions={{
                color: "#0f766e",
                fillColor: "#2dd4bf",
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <strong>{m.id}</strong>
                {m.address ? (
                  <>
                    <br />
                    {m.address}
                  </>
                ) : null}
                <br />
                <Link href={`/account/charge-boxes/update/${encodeURIComponent(m.id)}`}>
                  Edit charge box
                </Link>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </>
  );
}
