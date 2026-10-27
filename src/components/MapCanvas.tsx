import { useEffect, useRef, useState } from "react";
import type { FeatureCollection } from "../api/types";
import { MAP_STYLE } from "../config/map";
import { circlePolygon } from "../lib/circle";
import { currentTheme, type ThemeName } from "../lib/theme";

type MapHandle = {
  remove: () => void;
  isStyleLoaded: () => boolean;
  resize: () => void;
  jumpTo: (options: { center: [number, number]; zoom: number }) => void;
  getSource: (id: string) => { setData: (data: unknown) => void } | undefined;
  addSource: (id: string, source: unknown) => void;
  addLayer: (layer: unknown) => void;
  on: (event: string, handler: (event: { lngLat: { lng: number; lat: number } }) => void) => void;
  once: (event: string, handler: () => void) => void;
};

export type MapCanvasProps = {
  centre: [number, number];
  zoom: number;
  collection: FeatureCollection | null;
  circle: { centre: [number, number]; radiusKm: number } | null;
  onPick?: (coordinate: [number, number]) => void;
  label?: string;
  cooperativeGestures?: boolean;
  frameId?: string;
};

export function MapCanvas({
  centre,
  zoom,
  collection,
  circle,
  onPick,
  label = "Map of Australia",
  cooperativeGestures = false,
  frameId,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapHandle | null>(null);
  const pickRef = useRef(onPick);
  const viewRef = useRef({ centre, zoom });
  const [theme, setTheme] = useState<ThemeName>(() => currentTheme());
  const [outcome, setOutcome] = useState<{ theme: ThemeName; value: "ready" | "failed" } | null>(
    null,
  );
  const status = outcome?.theme === theme ? outcome.value : "loading";

  useEffect(() => {
    pickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    viewRef.current = { centre, zoom };
  }, [centre, zoom]);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(currentTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    let disposed = false;
    let map: MapHandle | undefined;
    void Promise.all([
      import("maplibre-gl"),
      import("maplibre-gl/dist/maplibre-gl.css"),
      import("maplibre-gl/dist/maplibre-gl-worker.mjs?url"),
    ])
      .then(([mod, , worker]) => {
        if (disposed) return;
        const maplibre = mod as unknown as {
          Map: new (options: Record<string, unknown>) => MapHandle;
          NavigationControl: new (options: { showCompass: boolean }) => unknown;
          setWorkerUrl: (url: string) => void;
        };
        // The bundled library looks for a sibling worker file that Vite does not emit.
        maplibre.setWorkerUrl(worker.default);
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        map = new maplibre.Map({
          container,
          style: theme === "dark" ? MAP_STYLE.dark : MAP_STYLE.light,
          center: viewRef.current.centre,
          zoom: viewRef.current.zoom,
          attributionControl: { compact: false },
          fadeDuration: reduceMotion ? 0 : 300,
          cooperativeGestures,
        });
        mapRef.current = map;
        const control = new maplibre.NavigationControl({ showCompass: false });
        (map as unknown as { addControl: (control: unknown, position: string) => void }).addControl(
          control,
          "top-right",
        );
        map.once("load", () => {
          if (disposed) return;
          map?.resize();
          setOutcome({ theme, value: "ready" });
        });
        map.on("click", (event) => {
          pickRef.current?.([event.lngLat.lng, event.lngLat.lat]);
        });
      })
      .catch(() => {
        if (!disposed) setOutcome({ theme, value: "failed" });
      });
    const timer = window.setTimeout(() => {
      setOutcome((current) =>
        current?.theme === theme && current.value === "ready"
          ? current
          : { theme, value: "failed" },
      );
    }, 8000);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      map?.remove();
      mapRef.current = null;
    };
  }, [theme, cooperativeGestures]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    map.jumpTo({ center: centre, zoom });
  }, [centre, zoom, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    const places = collection ?? { type: "FeatureCollection", features: [] };
    ensureGeoJson(map, "places", places);
    // MapLibre paint cannot read CSS variables. Fills mirror --data-navy, lines mirror --accent, and the radius mirrors --data-blue.
    const placeFill = theme === "dark" ? "#8eb0f0" : "#12285e";
    const placeLine = theme === "dark" ? "#c5d4ff" : "#12285e";
    ensureLayer(map, "places-fill", {
      id: "places-fill",
      type: "fill",
      source: "places",
      paint: { "fill-color": placeFill, "fill-opacity": theme === "dark" ? 0.34 : 0.28 },
    });
    ensureLayer(map, "places-line", {
      id: "places-line",
      type: "line",
      source: "places",
      paint: { "line-color": placeLine, "line-width": 1.25 },
    });
    const radiusData = circle
      ? {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: circlePolygon(circle.centre[0], circle.centre[1], circle.radiusKm),
            },
          ],
        }
      : { type: "FeatureCollection", features: [] };
    ensureGeoJson(map, "radius", radiusData);
    ensureLayer(map, "radius-fill", {
      id: "radius-fill",
      type: "fill",
      source: "radius",
      paint: {
        "fill-color": theme === "dark" ? "#6b93e8" : "#2f62c2",
        "fill-opacity": theme === "dark" ? 0.22 : 0.18,
      },
    });
  }, [collection, circle, status, theme]);

  return (
    <div className="map-frame" id={frameId} aria-busy={status === "loading"}>
      <div ref={containerRef} className="map-canvas" role="application" aria-label={label} />
      {status === "loading" ? (
        <p className="map-note tooltip" role="status">
          Loading the base map.
        </p>
      ) : null}
      {status === "failed" ? (
        <p className="map-note tooltip" role="status">
          The base map did not load. Place outlines appear when geometries do.
        </p>
      ) : null}
    </div>
  );
}

function ensureGeoJson(map: MapHandle, id: string, data: unknown) {
  const source = map.getSource(id);
  if (source) {
    source.setData(data);
    return;
  }
  map.addSource(id, { type: "geojson", data });
}

function ensureLayer(map: MapHandle, id: string, layer: unknown) {
  const existing = (map as unknown as { getLayer?: (layerId: string) => unknown }).getLayer?.(id);
  if (existing) return;
  map.addLayer(layer);
}
