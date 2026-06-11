declare global {
  interface Window {
    __SCMS_PUBLIC_CONFIG__?: {
      googleMapsApiKey?: string;
    };
  }
}

/** Maps key from server-injected runtime config, falling back to build-time env. */
export function getGoogleMapsApiKey(): string {
  if (typeof window !== "undefined") {
    const fromRuntime = window.__SCMS_PUBLIC_CONFIG__?.googleMapsApiKey?.trim();
    if (fromRuntime) return fromRuntime;
  }
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
}
