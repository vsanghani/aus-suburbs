import { Link, useParams } from "react-router-dom";
import { ApiError, fetchCouncil } from "../api/client";
import { useApi } from "../api/useApi";
import { ErrorState, LoadingState } from "../components/States";
import { findState } from "../config/geography";
import { formatNumber, humaniseSlug } from "../lib/format";
import { suburbPath } from "../lib/places";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { councilSections } from "../metrics/councilRegistry";

export function CouncilPage() {
  const params = useParams();
  const state = (params.state ?? "").toLowerCase();
  const slug = (params.slug ?? "").toLowerCase();
  const query = useApi(`council:${state}:${slug}`, (signal) => fetchCouncil(state, slug, signal));
  const place = query.status === "ready" ? query.data : null;
  const notOnFile =
    query.status === "error" && query.error instanceof ApiError && query.error.status === 404;
  const title = place?.name ?? humaniseSlug(slug);
  useDocumentTitle(title);
  const stateName = findState(state)?.name;

  return (
    <main className="page" id="content">
      <p className="kicker">
        {notOnFile ? "Not on file" : "Council"}
        {stateName ? ` · ${stateName}` : ""}
      </p>
      <h1>{title}</h1>
      <p className="lede">
        {notOnFile
          ? "Nothing is recorded for this council path. The sections below are the shape of the page."
          : (place?.narrative ?? place?.notice ?? "No narrative is attached.")}
      </p>
      {query.status === "loading" ? <LoadingState /> : null}
      {query.status === "error" && !notOnFile ? (
        <ErrorState error={query.error} onRetry={query.retry} />
      ) : null}
      <p>
        <Link to={`/states/${state}`}>Back to the state</Link>
      </p>
      {councilSections.map((section) => (
        <section key={section.id} id={section.id} className="metric-section" tabIndex={-1}>
          <h2>{section.title}</h2>
          <p className="lede">{section.lede}</p>
          {section.id === "suburbs" ? (
            <table className="data">
              <caption>
                {place?.dataset_connected
                  ? "Suburbs on file."
                  : "No suburbs are loaded for this council."}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Suburb</th>
                  <th scope="col">Postcode</th>
                  <th scope="col">Composite</th>
                </tr>
              </thead>
              <tbody>
                {(place?.suburbs.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={3}>No suburbs are loaded.</td>
                  </tr>
                ) : (
                  place?.suburbs.map((suburb) => (
                    <tr key={suburb.slug}>
                      <td>
                        <Link to={suburbPath(suburb.state, suburb.slug)}>{suburb.name}</Link>
                      </td>
                      <td>{suburb.postcode ?? "—"}</td>
                      <td className="num">
                        {suburb.score == null ? "—" : formatNumber(suburb.score)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <p className="empty-line">No figures are on file for this section.</p>
          )}
        </section>
      ))}
    </main>
  );
}
