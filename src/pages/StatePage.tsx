import { Link, useParams } from "react-router-dom";
import { ApiError, fetchState } from "../api/client";
import { useApi } from "../api/useApi";
import { MapCanvas } from "../components/MapCanvas";
import { ErrorState, LoadingState } from "../components/States";
import { TableScroll } from "../components/TableScroll";
import { findState, stateView } from "../config/geography";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { councilPath } from "../lib/places";

export function StatePage() {
  const params = useParams();
  const code = (params.code ?? "").toLowerCase();
  const local = findState(code);
  useDocumentTitle(local?.name ?? code.toUpperCase());
  const query = useApi(`state:${code}`, (signal) => fetchState(code, signal));
  const view = stateView(code);
  const missing =
    query.status === "error" && query.error instanceof ApiError && query.error.status === 404;

  return (
    <main id="content">
      <div className="page">
        <p className="kicker">State</p>
        <h1>{query.status === "ready" ? query.data.name : (local?.name ?? code.toUpperCase())}</h1>
        <p className="lede">
          Councils and regions for this state. The map is ready for boundaries; none are loaded.
        </p>
        {query.status === "loading" ? <LoadingState /> : null}
        {missing ? <p>No state is on file for this code.</p> : null}
        {query.status === "error" && !missing ? (
          <ErrorState error={query.error} onRetry={query.retry} />
        ) : null}
        {query.status === "ready" ? (
          <>
            <p>{query.data.narrative ?? query.data.notice}</p>
            <p>
              <Link to={`/explore?state=${query.data.code}`}>Open this state on the map</Link>
            </p>
            {query.data.regions.length > 0 ? (
              <>
                <h2>Regions</h2>
                <ul className="plain-index">
                  {query.data.regions.map((region) => (
                    <li key={region.slug}>
                      <strong>{region.name}</strong>
                      <span>
                        {region.council_count == null
                          ? "Council count not recorded"
                          : `${region.council_count} councils`}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <TableScroll>
              <table className="data">
                <caption>
                  {query.data.dataset_connected
                    ? `${query.data.councils.length} councils.`
                    : query.data.notice}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Council</th>
                    <th scope="col">Region</th>
                    <th scope="col">Suburbs</th>
                    <th scope="col">Composite</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.councils.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No councils are loaded.</td>
                    </tr>
                  ) : (
                    query.data.councils.map((council) => (
                      <tr key={council.slug}>
                        <td>
                          <Link to={councilPath(council.state, council.slug)}>{council.name}</Link>
                        </td>
                        <td>{council.region_name ?? "—"}</td>
                        <td className="num">{council.suburb_count ?? "—"}</td>
                        <td className="num">{council.score ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableScroll>
          </>
        ) : null}
      </div>
      <div className="map-band">
        <p className="map-band-label kicker">Map</p>
        <MapCanvas
          label={`Map of ${query.status === "ready" ? query.data.name : (local?.name ?? "Australia")}`}
          centre={view.centre}
          zoom={view.zoom}
          collection={null}
          circle={null}
        />
      </div>
    </main>
  );
}
