import { Link, useParams } from "react-router-dom";
import { ApiError, fetchState } from "../api/client";
import { useApi } from "../api/useApi";
import { ClientMap } from "../components/ClientMap";
import { ErrorState, LoadingState } from "../components/States";
import { findState, stateView } from "../config/geography";
import { Head } from "../seo/Head";
import { councilPath } from "../lib/places";

export function StatePage() {
  const params = useParams();
  const code = (params.code ?? "").toLowerCase();
  const local = findState(code);
  const query = useApi(`state:${code}`, (signal) => fetchState(code, signal));
  const view = stateView(code);
  const missing =
    query.status === "error" && query.error instanceof ApiError && query.error.status === 404;
  const name = query.status === "ready" ? query.data.name : (local?.name ?? code.toUpperCase());

  return (
    <main id="content">
      <Head
        title={name}
        description={
          missing
            ? `No state is on file for ${code || "this code"}.`
            : `Councils and regions in ${name}. The map is ready for boundaries.`
        }
        path={`/states/${code}`}
        status={missing ? 404 : 200}
        robots={missing ? "noindex" : undefined}
      />
      <div className="page">
        <p className="kicker">State</p>
        <h1>{name}</h1>
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
            <div className="table-scroll">
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
            </div>
          </>
        ) : null}
      </div>
      <ClientMap
        centre={view.centre}
        zoom={view.zoom}
        collection={null}
        circle={null}
        label={`Map centred on ${name}. Pan with two fingers, or use the controls.`}
        cooperativeGestures
      />
    </main>
  );
}
