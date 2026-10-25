import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, fetchRanking } from "../api/client";
import { useApi } from "../api/useApi";
import { FilterPills } from "../components/FilterPills";
import { RankTable } from "../components/RankTable";
import { ErrorState, LoadingState } from "../components/States";
import { STATES } from "../config/geography";
import { findRanking } from "../config/rankings";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export function RankingPage() {
  const params = useParams();
  const slug = params.slug ?? "";
  const local = findRanking(slug);
  const [stateCode, setStateCode] = useState("all");
  const [region, setRegion] = useState("all");
  const [council, setCouncil] = useState("all");
  useDocumentTitle(local?.title ?? "List");
  const query = useApi(`rank:${slug}:${stateCode}:${region}:${council}`, (signal) =>
    fetchRanking(
      slug,
      {
        state: stateCode === "all" ? undefined : stateCode,
        region: region === "all" ? undefined : region,
        council: council === "all" ? undefined : council,
      },
      signal,
    ),
  );
  const missing =
    query.status === "error" && query.error instanceof ApiError && query.error.status === 404;
  const title = query.status === "ready" ? query.data.ranking.title : (local?.title ?? "List");
  const question = query.status === "ready" ? query.data.ranking.question : local?.question;

  return (
    <main className="page" id="content">
      <p className="kicker">
        <Link to="/rankings">Rankings</Link>
      </p>
      <h1>{title}</h1>
      <p className="lede">{question ?? "This name is not a published list."}</p>
      <p>
        <Link to="/methodology">How the draft formula works</Link>
      </p>
      <FilterPills
        label="State"
        value={stateCode}
        onChange={setStateCode}
        options={[
          { id: "all", label: "All states" },
          ...STATES.map((state) => ({ id: state.code, label: state.name })),
        ]}
      />
      {query.status === "ready" && query.data.regions.length > 0 ? (
        <FilterPills
          label="Region"
          value={region}
          onChange={setRegion}
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
          onChange={setCouncil}
          options={[
            { id: "all", label: "All councils" },
            ...query.data.councils.map((item) => ({ id: item.slug, label: item.name })),
          ]}
        />
      ) : null}
      {query.status === "loading" ? <LoadingState /> : null}
      {missing ? <p>No list is published under this name.</p> : null}
      {query.status === "error" && !missing ? (
        <ErrorState error={query.error} onRetry={query.retry} />
      ) : null}
      {query.status === "ready" ? <RankTable ranking={query.data} /> : null}
    </main>
  );
}
