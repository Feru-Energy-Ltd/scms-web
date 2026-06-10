import { useJsApiLoader } from "@react-google-maps/api";

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];
const GOOGLE_MAPS_LOADER_ID = "google-map-script";

export function useGoogleMapsLoader() {
  return useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });
}
