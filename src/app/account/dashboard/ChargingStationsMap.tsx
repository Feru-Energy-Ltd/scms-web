"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleMap,
  InfoWindow,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { fetchChargingStations } from "@/lib/api/chargingStations";
import { asArray } from "@/lib/api/normalize";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "./dashboard-map.module.css";

type ChargerRow = Record<string, unknown>;

const DEFAULT_CENTER = { lat: -1.9441, lng: 30.0619 };
const FETCH_SIZE = 200;

type MapMarker = {
  key: string;
  id: string;
  lat: number;
  lng: number;
  address: string;
};

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

function GoogleStationsMap({ markers }: { markers: MapMarker[] }) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const active = markers.find((m) => m.key === activeKey) ?? null;

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (markers.length === 0) {
      map.setCenter(DEFAULT_CENTER);
      map.setZoom(12);
      return;
    }

    if (markers.length === 1) {
      const m = markers[0];
      map.setCenter({ lat: m.lat, lng: m.lng });
      map.setZoom(14);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
    map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });

    const listener = google.maps.event.addListenerOnce(map, "idle", () => {
      const z = map.getZoom();
      if (z != null && z > 15) map.setZoom(15);
    });
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [markers]);

  return (
    <GoogleMap
      mapContainerClassName={styles.map}
      center={DEFAULT_CENTER}
      zoom={12}
      onLoad={onMapLoad}
      options={{
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      }}
    >
      {markers.map((m) => (
        <Marker
          key={m.key}
          position={{ lat: m.lat, lng: m.lng }}
          onClick={() => setActiveKey(m.key)}
        />
      ))}
      {active ? (
        <InfoWindow
          position={{ lat: active.lat, lng: active.lng }}
          onCloseClick={() => setActiveKey(null)}
        >
          <div className={styles.infoWindow}>
            <strong>{active.id}</strong>
            {active.address ? (
              <>
                <br />
                {active.address}
              </>
            ) : null}
            <br />
            <Link href={`/account/charge-boxes/update/${encodeURIComponent(active.id)}`}>
              Edit charge box
            </Link>
          </div>
        </InfoWindow>
      ) : null}
    </GoogleMap>
  );
}

function GoogleMapShell({ apiKey, markers }: { apiKey: string; markers: MapMarker[] }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  });

  if (loadError) {
    return (
      <div className={styles.mapFallback} role="alert">
        Could not load Google Maps. Check the browser console and your API key configuration
        (Maps JavaScript API enabled, billing, HTTP referrers).
      </div>
    );
  }

  if (!isLoaded) {
    return <div className={styles.mapFallback}>Loading map…</div>;
  }

  return <GoogleStationsMap markers={markers} />;
}

export default function ChargingStationsMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
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
    const out: MapMarker[] = [];

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
        {!apiKey ? (
          <div className={styles.mapFallback}>
            Add <code className={styles.code}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your{" "}
            <code className={styles.code}>.env</code> file to show the map (enable the Maps
            JavaScript API for this key).
          </div>
        ) : (
          <GoogleMapShell apiKey={apiKey} markers={markers} />
        )}
      </div>
    </>
  );
}
