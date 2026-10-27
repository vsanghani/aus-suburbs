import { useContext } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiError, fetchRanking } from "../api/client";
import { useApi } from "../api/useApi";
import { FilterPills } from "../components/FilterPills";
import { RankTable } from "../components/RankTable";
import { ErrorState, LoadingState } from "../components/States";
import { STATES } from "../config/geography";
import { findRanking } from "../config/rankings";
import { rankingCopy } from "../seo/copy";
import { RouteDataContext } from "../seo/context";
import { Head } from "../seo/Head";
import { rankingKey } from "../seo/keys";
import { resourceSeed } from "../seo/routeData";

export function RankingPage() {
  const params = useParams();
  const slug = (params.slug ?? "").toLowerCase();
  const local = findRanking(slug);
  const routeData = useContext(RouteDataContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const stateCode = searchParams.get("state") ?? "all";
  const region = searchParams.get("region") ?? "all";
  const council = searchParams.get("council") ?? "all";

  function setFilter(name: "state" | "region" | "council", value: string) {
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete(name);
    else next.set(name, value);
    if (name === "state") {
      next.delete("region");
      next.delete("council");
    }
    setSearchParams(next, { replace: true });
  }
  const key = rankingKey(slug, stateCode, region, council);
  const query = useApi(
    key,
    (signal) =>
      fetchRanking(
        slug,
        {
          state: stateCode === "all" ? undefined : stateCode,
          region: region === "all" ? undefined : region,
          council: council === "all" ? undefined : council,
        },
        signal,
      ),
    resourceSeed(routeData.ranking, key),
  );
  const missing =
    !local ||
    (query.status === "error" && query.error instanceof ApiError && query.error.status === 404);
  const transportError = query.status === "error" && !missing;
  const title = query.status === "ready" ? query.data.ranking.title : (local?.title ?? "List");
  const question = query.status === "ready" ? query.data.ranking.question : local?.question;
  const copy = rankingCopy(slug, title, question, missing);

  return (
    <main className="page" id="content">
      <Head
        title={copy.title}
        description={copy.description}
        path={copy.path}
        status={missing ? 404 : transportError ? 503 : 200}
        robots={missing ? "noindex" : undefined}
      />
      <p className="kicker">
        <Link to="/rankings">Rankings</Link>
      </p>
      <h1>{title}</h1>
      <p className="lede">{question ?? "This name is not a published list."}</p>
      <p>
        <Link to="/methodology">How the draft formula works</Link>
      </p>
      <div className="filter-bar">
        <FilterPills
          label="State"
          value={stateCode}
          onChange={(id) => setFilter("state", id)}
          options={[
            { id: "all", label: "All states" },
            ...STATES.map((state) => ({ id: state.code, label: state.name })),
          ]}
        />
        {query.status === "ready" && query.data.regions.length > 0 ? (
          <FilterPills
            label="Region"
            value={region}
            onChange={(id) => setFilter("region", id)}
            options={[
              { id: "all", label: "All regions" },
              ...query.data.regions.map((item) => ({ id: item.slug, label: item.name })),
            ]}
          />
        ) : (
          <p>Region filters appear when the list returns them.</p>
        )}
        {query.status === "ready" && query.data.councils.length > 0 ? (
          <FilterPills
            label="Council"
            value={council}
            onChange={(id) => setFilter("council", id)}
            options={[
              { id: "all", label: "All councils" },
              ...query.data.councils.map((item) => ({ id: item.slug, label: item.name })),
            ]}
          />
        ) : null}
      </div>
      {query.status === "loading" ? <LoadingState /> : null}
      {missing ? <p>No list is published under this name.</p> : null}
      {query.status === "error" && !missing ? (
        <ErrorState error={query.error} onRetry={query.retry} />
      ) : null}
      {query.status === "ready" ? <RankTable ranking={query.data} /> : null}
    </main>
  );
}
