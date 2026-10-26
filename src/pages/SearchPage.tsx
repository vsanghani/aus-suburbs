import { Link, useSearchParams } from "react-router-dom";
import { fetchSearch } from "../api/client";
import { useApi } from "../api/useApi";
import { PageIntro } from "../components/PageIntro";
import { SearchField } from "../components/SearchField";
import { DatasetNotice, ErrorState, LoadingState } from "../components/States";
import { formatNumber } from "../lib/format";
import { councilPath, suburbPath } from "../lib/places";
import { Head } from "../seo/Head";

export function SearchPage() {
  const [params] = useSearchParams();
  const queryText = params.get("q") ?? "";
  const query = useApi(`search:${queryText}`, (signal) => fetchSearch(queryText, signal));

  return (
    <main className="page" id="content">
      <Head
        title={queryText ? `Search · ${queryText}` : "Search"}
        description={
          queryText
            ? `Search the record for ${queryText}.`
            : "Search the record for a suburb, a council, or a postcode."
        }
        path={queryText ? `/search?q=${encodeURIComponent(queryText)}` : "/search"}
      />
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
                {query.data.councils.map((council) => (
                  <li key={`${council.state}-${council.slug}`}>
                    <Link to={councilPath(council.state, council.slug)}>
                      <strong>{council.name}</strong>
                      <span>Council · {council.state.toUpperCase()}</span>
                    </Link>
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
