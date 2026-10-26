import { Link, useSearchParams } from "react-router-dom";
import { fetchSearch } from "../api/client";
import { useApi } from "../api/useApi";
import { PageIntro } from "../components/PageIntro";
import { SearchField } from "../components/SearchField";
import { DatasetNotice, ErrorState, LoadingState } from "../components/States";
import { formatNumber } from "../lib/format";
import { councilPath, suburbPath } from "../lib/places";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export function SearchPage() {
  const [params] = useSearchParams();
  const queryText = params.get("q") ?? "";
  useDocumentTitle(queryText ? `Search · ${queryText}` : "Search");
  const query = useApi(`search:${queryText}`, (signal) => fetchSearch(queryText, signal));
  const ready = queryText !== "" && query.status === "ready" ? query.data : null;
  const suburbs = ready?.results ?? [];
  const councils = ready?.councils ?? [];
  const hasMatches = suburbs.length > 0 || councils.length > 0;

  return (
    <main className="page" id="content">
      <PageIntro
        kicker="Search"
        title="Find a place"
        lede="A suburb, a council, or a postcode. Matches appear when a dataset is connected."
      />
      <SearchField key={queryText} initial={queryText} suggest={false} />
      {queryText === "" ? <p>Enter at least two characters.</p> : null}
      {queryText !== "" && query.status === "loading" ? (
        <LoadingState label="Searching the record." />
      ) : null}
      {queryText !== "" && query.status === "error" ? (
        <ErrorState error={query.error} onRetry={query.retry} />
      ) : null}
      {ready && !ready.dataset_connected ? (
        <DatasetNotice
          connected={false}
          notice={ready.notice}
          emptyTitle="Nothing matched"
          emptyBody="The search ran and returned no places."
        />
      ) : null}
      {ready && ready.dataset_connected && !hasMatches ? (
        <DatasetNotice
          connected
          notice={ready.notice}
          emptyTitle="Nothing matched"
          emptyBody="The search ran and returned no places."
        />
      ) : null}
      {ready && ready.dataset_connected && hasMatches ? (
        <div>
          <p className="status-line" role="status">
            {matchSummary(suburbs.length, councils.length)}
          </p>
          {suburbs.length > 0 ? (
            <section className="band">
              <h2>Suburbs</h2>
              <ul className="link-index">
                {suburbs.map((place) => (
                  <li key={`${place.state}-${place.slug}`}>
                    <Link to={suburbPath(place.state, place.slug)}>
                      <strong>{place.name}</strong>
                      <span>
                        {place.state.toUpperCase()}
                        {place.postcode ? ` · ${place.postcode}` : ""}
                        {place.score == null ? "" : ` · ${formatNumber(place.score)}`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {councils.length > 0 ? (
            <section className="band">
              <h2>Councils</h2>
              <ul className="link-index">
                {councils.map((council) => (
                  <li key={`${council.state}-${council.slug}`}>
                    <Link to={councilPath(council.state, council.slug)}>
                      <strong>{council.name}</strong>
                      <span>Council · {council.state.toUpperCase()}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}

function matchSummary(suburbs: number, councils: number): string {
  const parts: string[] = [];
  if (suburbs > 0) parts.push(`${suburbs} ${suburbs === 1 ? "suburb" : "suburbs"}`);
  if (councils > 0) parts.push(`${councils} ${councils === 1 ? "council" : "councils"}`);
  return `${parts.join(", ")}.`;
}
