import { useJsApiLoader } from "@react-google-maps/api";
import { getGoogleMapsApiKey } from "@/lib/publicConfig";

const GOOGLE_MAPS_LOADER_ID = "google-map-script";
const GOOGLE_PLACES_LOADER_ID = "google-map-places-script";

/** Base Maps JavaScript API — use for map display (markers, info windows). */
export function useGoogleMapsLoader() {
  return useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: getGoogleMapsApiKey(),
  });
}

/** Maps JavaScript API + Places library — use for address autocomplete only. */
export function useGooglePlacesLoader() {
  return useJsApiLoader({
    id: GOOGLE_PLACES_LOADER_ID,
    googleMapsApiKey: getGoogleMapsApiKey(),
    libraries: ["places"],
  });
}
