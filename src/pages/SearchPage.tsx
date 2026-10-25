import { useSearchParams } from "react-router-dom";
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

  return (
    <main className="page" id="content">
      <PageIntro
        kicker="Search"
        title="Find a place"
        lede="A suburb, a council, or a postcode. Matches appear when a dataset is connected."
      />
      <SearchField key={queryText} initial={queryText} />
      {queryText === "" ? <p>Enter at least two characters.</p> : null}
      {queryText !== "" && query.status === "loading" ? (
        <LoadingState label="Searching the record." />
      ) : null}
      {queryText !== "" && query.status === "error" ? (
        <ErrorState error={query.error} onRetry={query.retry} />
      ) : null}
      {queryText !== "" && query.status === "ready" ? (
        query.data.dataset_connected ? (
          query.data.results.length === 0 && query.data.councils.length === 0 ? (
            <DatasetNotice
              connected
              notice={query.data.notice}
              emptyTitle="Nothing matched"
              emptyBody="The search ran and returned no places."
            />
          ) : (
            <div>
              <ul className="link-index">
                {query.data.results.map((place) => (
                  <li key={`${place.state}-${place.slug}`}>
                    <a href={suburbPath(place.state, place.slug)}>
                      <strong>{place.name}</strong>
                      <span>
                        {place.state.toUpperCase()}
                        {place.postcode ? ` · ${place.postcode}` : ""}
                        {place.score == null ? "" : ` · ${formatNumber(place.score)}`}
                      </span>
                    </a>
                  </li>
                ))}
                {query.data.councils.map((council) => (
                  <li key={`${council.state}-${council.slug}`}>
                    <a href={councilPath(council.state, council.slug)}>
                      <strong>{council.name}</strong>
                      <span>Council · {council.state.toUpperCase()}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )
        ) : (
          <DatasetNotice
            connected={false}
            notice={query.data.notice}
            emptyTitle="Nothing matched"
            emptyBody="The search ran and returned no places."
          />
        )
      ) : null}
    </main>
  );
}
