"use client";

import { useState } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMapsLoader } from "@/lib/googleMapsLoader";
import styles from "./MapCard.module.css";

export default function MapCard({
  lat,
  lng,
  label,
}: {
  lat?: string | null;
  lng?: string | null;
  label?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { isLoaded } = useGoogleMapsLoader();

  const hasCoords = Boolean(lat && lng);
  if (!hasCoords) return <div className={styles.card}>No location set.</div>;
  if (!isLoaded) return <div className={styles.card}>Loading map…</div>;

  const center = { lat: Number(lat), lng: Number(lng) };

  return (
    <div
      className={`${styles.card} ${expanded ? styles.expanded : ""}`}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={() => setExpanded((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setExpanded((v) => !v);
        }
      }}
    >
      <GoogleMap
        mapContainerClassName={styles.map}
        center={center}
        zoom={14}
        options={{ disableDefaultUI: true, gestureHandling: expanded ? "auto" : "none" }}
      >
        <Marker position={center} title={label} />
      </GoogleMap>
    </div>
  );
}
