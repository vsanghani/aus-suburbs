import { useContext, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchExplore } from "../api/client";
import { useApi } from "../api/useApi";
import { ClientMap } from "../components/ClientMap";
import { FilterPills } from "../components/FilterPills";
import { DatasetNotice, ErrorState, LoadingState } from "../components/States";
import { STATES, stateView } from "../config/geography";
import { EXPLORE_LAYERS } from "../config/map";
import { exploreCopy } from "../seo/copy";
import { RouteDataContext } from "../seo/context";
import { Head } from "../seo/Head";
import { exploreKey } from "../seo/keys";
import { resourceSeed } from "../seo/routeData";
import { mapMetrics } from "../metrics/registry";

const LAYER_IDS = new Set<string>(EXPLORE_LAYERS.map((layer) => layer.id));

export function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const routeData = useContext(RouteDataContext);
  const metrics = useMemo(() => mapMetrics(), []);
  const metric = params.get("metric") ?? "score";
  const stateCode = params.get("state") ?? "all";
  const layers = (params.get("layers") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => LAYER_IDS.has(item));
  const [radiusOn, setRadiusOn] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const [picked, setPicked] = useState<[number, number] | null>(null);
  const view = stateView(stateCode === "all" ? undefined : stateCode);
  const key = exploreKey(metric, stateCode, layers);
  const query = useApi(
    key,
    (signal) =>
      fetchExplore(
        {
          metric,
          state: stateCode === "all" ? undefined : stateCode,
          layers,
        },
        signal,
      ),
    resourceSeed(routeData.explore, key),
  );

  function write(next: { metric?: string; state?: string; layers?: string[] }) {
    const metricValue = next.metric ?? metric;
    const stateValue = next.state ?? stateCode;
    const layerValue = next.layers ?? layers;
    const paramsNext = new URLSearchParams(params);
    if (metricValue && metricValue !== "score") paramsNext.set("metric", metricValue);
    else paramsNext.delete("metric");
    if (stateValue && stateValue !== "all") paramsNext.set("state", stateValue);
    else paramsNext.delete("state");
    if (layerValue.length > 0) paramsNext.set("layers", layerValue.join(","));
    else paramsNext.delete("layers");
    setParams(paramsNext, { replace: true });
  }

  function toggleLayer(id: string) {
    const next = layers.includes(id) ? layers.filter((item) => item !== id) : [...layers, id];
    write({ layers: next });
  }

  const features = query.status === "ready" ? query.data.feature_collection.features.length : 0;

  return (
    <main className="explore" id="content">
      <Head {...exploreCopy()} />
      <div className="explore-panel">
        <p className="kicker">Map</p>
        <h1>Explore</h1>
        <p>Choose a metric, then a state. Boundaries draw when the service returns them.</p>
        <p>
          <a href="#map">Jump to the map</a>
        </p>
        <label className="field">
          Metric
          <select value={metric} onChange={(event) => write({ metric: event.target.value })}>
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
          onChange={(id) => write({ state: id })}
          options={[
            { id: "all", label: "All" },
            ...STATES.map((state) => ({
              id: state.code,
              label: state.code.toUpperCase(),
              labelLong: state.name,
            })),
          ]}
        />
        <fieldset>
          <legend className="kicker">Layers</legend>
          {EXPLORE_LAYERS.map((layer) => (
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
              id="explore-radius"
              type="range"
              min={1}
              max={30}
              value={radiusKm}
              aria-valuetext={`${radiusKm} kilometres`}
              aria-describedby="explore-radius-note"
              onChange={(event) => setRadiusKm(Number(event.target.value))}
            />
            <span id="explore-radius-note" className="num">
              {radiusKm} km. Click the map to place it.
            </span>
          </label>
        ) : null}
        {query.status === "loading" ? <LoadingState label="Asking for geometries." /> : null}
        {query.status === "error" ? <ErrorState error={query.error} onRetry={query.retry} /> : null}
        {query.status === "ready" && !query.data.dataset_connected ? (
          <DatasetNotice
            connected={false}
            notice={query.data.notice}
            emptyTitle="No boundaries in view"
            emptyBody="The map query returned no geometries."
          />
        ) : null}
        {query.status === "ready" && query.data.dataset_connected && features === 0 ? (
          <DatasetNotice
            connected
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
        frameId="map"
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
