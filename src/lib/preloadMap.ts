let started = false;

/** Start the map library download before the explore page opens. */
export function preloadMap(): void {
  if (started) return;
  started = true;
  void import("maplibre-gl");
  void import("maplibre-gl/dist/maplibre-gl.css");
  void import("maplibre-gl/dist/maplibre-gl-worker.mjs?url");
}
