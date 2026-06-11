"use client";

import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useGooglePlacesLoader } from "@/lib/googleMapsLoader";
import styles from "./CreateStationModal.module.css";
import formStyles from "./ResourceList.module.css";

type Props = {
  submitting: boolean;
  convertingImage: boolean;
  address: string;
  setAddress: Dispatch<SetStateAction<string>>;
  latitude: string;
  setLatitude: Dispatch<SetStateAction<string>>;
  longitude: string;
  setLongitude: Dispatch<SetStateAction<string>>;
  adminAddress: string;
  setAdminAddress: Dispatch<SetStateAction<string>>;
  imageName: string;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function CreateStationModal({
  submitting,
  convertingImage,
  address,
  setAddress,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  adminAddress,
  setAdminAddress,
  imageName,
  onImageChange,
  onClose,
  onSubmit,
}: Props) {
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const { isLoaded } = useGooglePlacesLoader();

  useEffect(() => {
    if (!isLoaded || !addressInputRef.current || !window.google?.maps?.places) {
      return;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(
      addressInputRef.current,
      {
        fields: ["formatted_address", "geometry"],
        types: ["geocode"],
      },
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const formatted = place.formatted_address ?? "";
      if (formatted) {
        setAddress(formatted);
      }

      const location = place.geometry?.location;
      if (location) {
        setLatitude(location.lat().toFixed(6));
        setLongitude(location.lng().toFixed(6));
      }
    });

    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [isLoaded, setAddress, setLatitude, setLongitude]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create station</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            Close
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="stationAddress">
              Address
            </label>
            <input
              ref={addressInputRef}
              id="stationAddress"
              className={formStyles.textInput}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="Street, city"
            />
            <small className={formStyles.muted}>
              {isLoaded && typeof window !== "undefined" && window.google?.maps?.places
                ? "Start typing to search Google Maps, then select an address from the dropdown."
                : "Google Places is not loaded on this view; enter address manually."}
            </small>
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="stationLat">
              Latitude (optional)
            </label>
            <input
              id="stationLat"
              className={formStyles.textInput}
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              inputMode="decimal"
              placeholder="-1.26"
            />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="stationLng">
              Longitude (optional)
            </label>
            <input
              id="stationLng"
              className={formStyles.textInput}
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              inputMode="decimal"
              placeholder="36.80"
            />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="adminAddress">
              Admin address
            </label>
            <input
              id="adminAddress"
              className={formStyles.textInput}
              value={adminAddress}
              onChange={(e) => setAdminAddress(e.target.value)}
              placeholder="Operations address"
              required
            />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="stationImage">
              Image upload (optional)
            </label>
            <input
              id="stationImage"
              type="file"
              className={formStyles.textInput}
              accept="image/*"
              onChange={onImageChange}
            />
            <small className={formStyles.muted}>
              {convertingImage
                ? "Processing image..."
                : imageName
                  ? `Selected: ${imageName}`
                  : "Image should show the station ."}
            </small>
          </div>

          <button
            type="submit"
            className={formStyles.buttonPrimary}
            disabled={submitting || convertingImage}
          >
            {submitting ? "Creating…" : "Create station"}
          </button>
        </form>
      </div>
    </div>
  );
}
