"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { createStation } from "@/lib/api/stations";
import { getAccessTokenContext } from "@/lib/auth/jwtContext";
import { useGoogleMapsLoader } from "@/lib/googleMapsLoader";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import listStyles from "@/components/account/ResourceList.module.css";
import styles from "./create-station.module.css";

export default function CreateStationPage() {
  const router = useRouter();
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const { isLoaded } = useGoogleMapsLoader();

  const [submitting, setSubmitting] = useState(false);
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [adminAddress, setAdminAddress] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");

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
  }, [isLoaded]);

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

    const authContext = getAccessTokenContext();
    const providerId = authContext.providerId;
    const userId = authContext.userId;
    if (providerId == null && userId == null) {
      toast.error("Session context missing. Please log in again.");
      return;
    }

    setSubmitting(true);
    try {
      await createStation({
        providerId,
        locationAddressName: trimmedAddr,
        locationLatitude: latitude.trim() || undefined,
        locationLongitude: longitude.trim() || undefined,
        adminAddress: trimmedAdminAddress,
        imageBase64: imageDataUrl.trim() || undefined,
      });
      toast.success("Station created");
      router.push("/account/stations");
    } catch (err) {
      showApiErrorToast(err, { fallbackMessage: "Could not create station." });
    } finally {
      setSubmitting(false);
    }
  }

  const placesReady =
    isLoaded && typeof window !== "undefined" && !!window.google?.maps?.places;

  return (
    <div>
      <h1 className={listStyles.h1}>New station</h1>
      <p className={listStyles.muted}>
        Register a physical site that can host one or more charge boxes. Prefer
        searching the address so latitude and longitude are filled in
        automatically.
      </p>

      <form className={styles.form} onSubmit={onSubmit}>
        <div className={listStyles.field}>
          <label className={listStyles.label} htmlFor="stationAddress">
            Location address
          </label>
          <input
            ref={addressInputRef}
            id="stationAddress"
            className={listStyles.textInput}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            autoComplete="off"
            placeholder="Street, city"
          />
          <p className={listStyles.muted}>
            {placesReady
              ? "Start typing to search Google Maps, then select an address from the dropdown."
              : "Google Places is not loaded; enter the address manually."}
          </p>
        </div>

        <div className={styles.row2}>
          <div className={listStyles.field}>
            <label className={listStyles.label} htmlFor="stationLat">
              Latitude (optional)
            </label>
            <input
              id="stationLat"
              className={listStyles.textInput}
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              inputMode="decimal"
              placeholder="-1.94"
            />
          </div>
          <div className={listStyles.field}>
            <label className={listStyles.label} htmlFor="stationLng">
              Longitude (optional)
            </label>
            <input
              id="stationLng"
              className={listStyles.textInput}
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              inputMode="decimal"
              placeholder="30.06"
            />
          </div>
        </div>

        <div className={listStyles.field}>
          <label className={listStyles.label} htmlFor="adminAddress">
            Admin / operations address
          </label>
          <input
            id="adminAddress"
            className={listStyles.textInput}
            value={adminAddress}
            onChange={(e) => setAdminAddress(e.target.value)}
            required
            placeholder="Billing or operations contact address"
          />
          <p className={listStyles.muted}>
            Used for internal operations; can differ from the public site
            address.
          </p>
        </div>

        <div className={listStyles.field}>
          <label className={listStyles.label} htmlFor="stationImage">
            Station image (optional)
          </label>
          <input
            id="stationImage"
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={onImageChange}
          />
          <p className={listStyles.muted}>
            A photo of the site helps operators recognize the location.
          </p>
          {imageDataUrl ? (
            <div className={styles.previewWrap}>
              <Image
                src={imageDataUrl}
                alt="Station preview"
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
            {submitting ? "Creating…" : "Create station"}
          </button>
          <Link href="/account/stations" className={listStyles.button}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
