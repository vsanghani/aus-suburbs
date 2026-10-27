import { useEffect, useState, type ComponentType } from "react";
import type { MapCanvasProps } from "./MapCanvas";

/** Loads the map in the browser. The server renders the map frame only. */
export function ClientMap(props: MapCanvasProps) {
  const [MapView, setMapView] = useState<ComponentType<MapCanvasProps> | null>(null);

  useEffect(() => {
    let active = true;
    void import("./MapCanvas").then((mod) => {
      if (active) setMapView(() => mod.MapCanvas);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!MapView) {
    return (
      <div className="map-frame">
        <div className="map-canvas" role="img" aria-label={props.label ?? "Map of Australia"} />
      </div>
    );
  }
  return <MapView {...props} />;
}
