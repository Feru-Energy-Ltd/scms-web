/** Injects public runtime config so NEXT_PUBLIC_* vars can be supplied at container start. */
export function PublicConfigScript() {
  const config = {
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "",
  };

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.__SCMS_PUBLIC_CONFIG__=${JSON.stringify(config)};`,
      }}
    />
  );
}
