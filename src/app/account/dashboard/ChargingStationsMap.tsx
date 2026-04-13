"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import {
  GoogleMap,
  InfoWindow,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { fetchChargeBoxGeoLocations } from "@/lib/api/chargingStations";
import { asArray } from "@/lib/api/normalize";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import styles from "./dashboard-map.module.css";

type ChargerRow = Record<string, unknown>;

const DEFAULT_CENTER = { lat: -1.9441, lng: 30.0619 };

type MapMarker = {
  key: string;
  id: string;
  lat: number;
  lng: number;
  description: string;
  statusLine: string;
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

function statusParts(row: ChargerRow, ...keys: string[]): string {
  const parts: string[] = [];
  for (const k of keys) {
    const v = row[k];
    if (v == null || v === "") continue;
    parts.push(String(v));
  }
  return parts.join(" · ");
}

function geolocationMessage(code: number): string {
  switch (code) {
    case GeolocationPositionError.PERMISSION_DENIED:
      return "Location access was denied. Allow location for this site in your browser settings.";
    case GeolocationPositionError.POSITION_UNAVAILABLE:
      return "Your position could not be determined.";
    case GeolocationPositionError.TIMEOUT:
      return "Location request timed out.";
    default:
      return "Could not get your location.";
  }
}

/** Green map pin with lightning — data-URL for Google Maps Marker. */
function chargerStationMapIcon(): google.maps.Icon {
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40"><path fill="#16a34a" stroke="#14532d" stroke-width="1.2" stroke-linejoin="round" d="M16 2C10.5 2 6 6.4 6 11.8c0 6.8 9.2 20.7 9.7 21.5.3.5.8.7 1.3.7s1-.2 1.3-.7C18.8 32.5 26 18.6 26 11.8 26 6.4 21.5 2 16 2z"/><path fill="#f0fdf4" d="M17.4 9.2h-3.2l-2.1 5.6h2.8l-2.3 7.1 7.4-9.2h-3l1.6-3.5z"/></svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(36, 45),
    anchor: new google.maps.Point(18, 45),
  };
}

function GoogleStationsMap({
  markers,
  pendingCenter,
  onPendingCenterConsumed,
}: {
  markers: MapMarker[];
  pendingCenter: google.maps.LatLngLiteral | null;
  onPendingCenterConsumed: () => void;
}) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const pendingCenterRef = useRef(pendingCenter);

  useLayoutEffect(() => {
    pendingCenterRef.current = pendingCenter;
  }, [pendingCenter]);

  const [activeMarker, setActiveMarker] = useState<{
    key: string;
    openedAt: number;
  } | null>(null);
  const [userPin, setUserPin] = useState<google.maps.LatLngLiteral | null>(null);
  const active = activeMarker
    ? markers.find((m) => m.key === activeMarker.key) ?? null
    : null;

  const applyPendingCenter = useCallback(
    (map: google.maps.Map, center: google.maps.LatLngLiteral) => {
      map.panTo(center);
      const z = map.getZoom();
      if (z == null || z < 15) map.setZoom(15);
      setUserPin(center);
      onPendingCenterConsumed();
    },
    [onPendingCenterConsumed],
  );

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      const p = pendingCenterRef.current;
      if (p) {
        applyPendingCenter(map, p);
      }
    },
    [applyPendingCenter],
  );

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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pendingCenter) return;
    applyPendingCenter(map, pendingCenter);
  }, [pendingCenter, applyPendingCenter]);

  const userMarkerIcon = useMemo(
    () => ({
      path: google.maps.SymbolPath.CIRCLE,
      scale: 9,
      fillColor: "#2563eb",
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
    }),
    [],
  );

  const chargerIcon = useMemo(() => chargerStationMapIcon(), []);

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
      {userPin ? (
        <Marker
          position={userPin}
          icon={userMarkerIcon}
          zIndex={1000}
          title="Your location"
        />
      ) : null}
      {markers.map((m) => (
        <Marker
          key={m.key}
          position={{ lat: m.lat, lng: m.lng }}
          icon={chargerIcon}
          onClick={() => setActiveMarker({ key: m.key, openedAt: Date.now() })}
        />
      ))}
      {active ? (
        <InfoWindow
          key={`${active.key}-${activeMarker?.openedAt ?? 0}`}
          position={{ lat: active.lat, lng: active.lng }}
          onCloseClick={() => setActiveMarker(null)}
        >
          <div className={styles.infoWindow}>
            <h2 className={styles.infoTitle}>{active.id}</h2>
            {active.description ? (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Description</span>
                <span className={styles.infoValue}>{active.description}</span>
              </div>
            ) : null}
            {active.statusLine ? 
            (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Status</span>
                <span className={ active.statusLine.startsWith("ON") ? styles.infoActive: styles.infoMuted}>{active.statusLine}</span>
              </div>
            ) : null}
          </div>
        </InfoWindow>
      ) : null}
    </GoogleMap>
  );
}

function GoogleMapShell({
  apiKey,
  markers,
  pendingCenter,
  onPendingCenterConsumed,
}: {
  apiKey: string;
  markers: MapMarker[];
  pendingCenter: google.maps.LatLngLiteral | null;
  onPendingCenterConsumed: () => void;
}) {
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

  return (
    <GoogleStationsMap
      markers={markers}
      pendingCenter={pendingCenter}
      onPendingCenterConsumed={onPendingCenterConsumed}
    />
  );
}

export default function ChargingStationsMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  const [rows, setRows] = useState<ChargerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [pendingCenter, setPendingCenter] =
    useState<google.maps.LatLngLiteral | null>(null);

  const clearPendingCenter = useCallback(() => setPendingCenter(null), []);

  const handleMyLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Location is not supported in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setPendingCenter({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        setLocating(false);
        toast.error(geolocationMessage(err.code));
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await fetchChargeBoxGeoLocations();
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
      const lat = parseCoord(row, "latitude", "locationLatitude");
      const lng = parseCoord(row, "longitude", "locationLongitude");
      if (lat == null || lng == null) return;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

      const id =
        cell(row, "chargeBoxId", "id", "chargerId") || `row-${i}`;
      const description = cell(row, "description", "address");
      const statusLine = statusParts(
        row,
        "chargeStatus",
        "registrationStatus",
      );
      out.push({
        key: `${id}-${lat}-${lng}-${i}`,
        id,
        lat,
        lng,
        description,
        statusLine,
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
            : ` showing ${markers.length} on map `}
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
          <div className={styles.mapStack}>
            <GoogleMapShell
              apiKey={apiKey}
              markers={markers}
              pendingCenter={pendingCenter}
              onPendingCenterConsumed={clearPendingCenter}
            />
            <div className={styles.mapOverlayControls}>
              <button
                type="button"
                className={styles.locateIconBtn}
                disabled={locating}
                aria-label="Center map on my current location"
                aria-busy={locating}
                title={locating ? "Getting location…" : "My location"}
                onClick={handleMyLocation}
              >
                {locating ? (
                  <span className={styles.locateSpinner} aria-hidden />
                ) : (
                  <svg
                    className={styles.locateIcon}
                    viewBox="0 0 24 24"
                    width={22}
                    height={22}
                    aria-hidden
                  >
                    <path
                      fill="currentColor"
                      d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
