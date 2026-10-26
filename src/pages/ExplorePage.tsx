import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchExplore } from "../api/client";
import { useApi } from "../api/useApi";
import { FilterPills } from "../components/FilterPills";
import { ClientMap } from "../components/ClientMap";
import { DatasetNotice, ErrorState, LoadingState } from "../components/States";
import { STATES, stateView } from "../config/geography";
import { Head } from "../seo/Head";
import { mapMetrics } from "../metrics/registry";

const LAYERS = [
  { id: "boundary", label: "Suburb boundaries" },
  { id: "flood", label: "Flood overlay" },
  { id: "bushfire", label: "Bushfire overlay" },
  { id: "schools", label: "Schools" },
  { id: "transit", label: "Transit" },
  { id: "parks", label: "Parks" },
  { id: "offences", label: "Offence counts" },
];

export function ExplorePage() {
  const [params] = useSearchParams();
  const metrics = useMemo(() => mapMetrics(), []);
  const [metric, setMetric] = useState(params.get("metric") ?? "score");
  const [stateCode, setStateCode] = useState(params.get("state") ?? "all");
  const [layers, setLayers] = useState<string[]>([]);
  const [radiusOn, setRadiusOn] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const [picked, setPicked] = useState<[number, number] | null>(null);
  const view = stateView(stateCode === "all" ? undefined : stateCode);
  const key = `${metric}|${stateCode}|${layers.join(",")}`;
  const query = useApi(key, (signal) =>
    fetchExplore(
      {
        metric,
        state: stateCode === "all" ? undefined : stateCode,
        layers,
      },
      signal,
    ),
  );

  function toggleLayer(id: string) {
    setLayers((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <main className="explore" id="content">
      <Head
        title="Explore"
        description="A map of suburb boundaries and overlays. Geometries appear when a dataset is connected."
        path="/explore"
      />
      <div className="explore-panel">
        <p className="kicker">Map</p>
        <h1>Explore</h1>
        <p>Choose a metric, then a state. Boundaries draw when the service returns them.</p>
        <label className="field">
          Metric
          <select value={metric} onChange={(event) => setMetric(event.target.value)}>
            {metrics.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <FilterPills
          label="State"
          value={stateCode}
          onChange={setStateCode}
          options={[
            { id: "all", label: "All" },
            ...STATES.map((state) => ({ id: state.code, label: state.code.toUpperCase() })),
          ]}
        />
        <fieldset>
          <legend className="kicker">Layers</legend>
          {LAYERS.map((layer) => (
            <label key={layer.id} className="check">
              <input
                type="checkbox"
                checked={layers.includes(layer.id)}
                onChange={() => toggleLayer(layer.id)}
              />
              {layer.label}
            </label>
          ))}
          <p>Offence counts follow footfall as well as harm.</p>
        </fieldset>
        <label className="check">
          <input
            type="checkbox"
            checked={radiusOn}
            onChange={(event) => setRadiusOn(event.target.checked)}
          />
          Draw a radius
        </label>
        {radiusOn ? (
          <label className="field">
            Radius, kilometres
            <input
              type="range"
              min={1}
              max={30}
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value))}
            />
            <span className="num">{radiusKm} km. Click the map to place it.</span>
          </label>
        ) : null}
        {query.status === "loading" ? <LoadingState label="Asking for geometries." /> : null}
        {query.status === "error" ? <ErrorState error={query.error} onRetry={query.retry} /> : null}
        {query.status === "ready" ? (
          <DatasetNotice
            connected={query.data.dataset_connected}
            notice={query.data.notice}
            emptyTitle="No boundaries in view"
            emptyBody="The map query returned no geometries."
          />
        ) : null}
        {query.status === "ready" && layers.length > 0 ? (
          <p>
            {layers.join(", ")}: no features are loaded for{" "}
            {query.data.layers.join(", ") || "this view"}.
          </p>
        ) : null}
      </div>
      <ClientMap
        centre={view.centre}
        zoom={view.zoom}
        label={
          radiusOn ? "Map of Australia. Click the map to place the radius." : "Map of Australia"
        }
        collection={query.status === "ready" ? query.data.feature_collection : null}
        circle={radiusOn && picked ? { centre: picked, radiusKm } : null}
        onPick={radiusOn ? setPicked : undefined}
      />
    </main>
  );
}
