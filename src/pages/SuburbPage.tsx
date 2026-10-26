import { useContext, useState, useSyncExternalStore } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, fetchSuburb } from "../api/client";
import { useApi } from "../api/useApi";
import { MetricSection } from "../components/MetricSection";
import { SectionNav } from "../components/SectionNav";
import { ErrorState, LoadingState } from "../components/States";
import { findState } from "../config/geography";
import { siteOrigin } from "../config/site";
import { formatNumber, humaniseSlug } from "../lib/format";
import { subscribeShortlist, toggleKept, shortlistSnapshot } from "../lib/shortlist";
import { registry } from "../metrics/registry";
import { suburbCopy } from "../seo/copy";
import { OriginContext, RouteDataContext } from "../seo/context";
import { Head } from "../seo/Head";
import { placeJsonLd } from "../seo/jsonld";
import { suburbSeed } from "../seo/routeData";

export function SuburbPage() {
  const params = useParams();
  const state = (params.state ?? "").toLowerCase();
  const slug = (params.slug ?? "").toLowerCase();
  const key = `${state}:${slug}`;
  const routeData = useContext(RouteDataContext);
  const origin = useContext(OriginContext) ?? siteOrigin();
  const query = useApi(
    key,
    (signal) => fetchSuburb(state, slug, signal),
    suburbSeed(routeData.suburb, key),
  );
  const place = query.status === "ready" ? query.data : null;
  const notOnFile =
    query.status === "error" && query.error instanceof ApiError && query.error.status === 404;
  const copy = suburbCopy(state, slug, place, notOnFile);
  const [copied, setCopied] = useState(false);
  const kept = useSyncExternalStore(
    subscribeShortlist,
    () => shortlistSnapshot().some((item) => item.state === state && item.slug === slug),
    () => false,
  );
  const stateName = findState(state)?.name;
  const transportError = query.status === "error" && !notOnFile;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function keep() {
    if (!place) return;
    toggleKept({
      state: place.state,
      slug: place.slug,
      name: place.name,
      savedAt: new Date().toISOString(),
    });
  }

  return (
    <main className="page" id="content">
      <Head
        title={copy.title}
        description={copy.description}
        path={copy.path}
        status={notOnFile ? 404 : transportError ? 503 : 200}
        robots={notOnFile ? "noindex" : undefined}
        jsonLd={place ? placeJsonLd(place, copy.path, origin) : null}
      />
      <p className="kicker">
        {query.status === "loading" ? "Fetching" : notOnFile ? "Not on file" : "Suburb"}
        {stateName ? ` · ${stateName}` : state ? ` · ${state.toUpperCase()}` : ""}
      </p>
      <h1>{place?.name ?? humaniseSlug(slug)}</h1>
      {notOnFile ? (
        <p className="lede">
          {(query.error instanceof ApiError
            ? query.error.detail
            : "This path is not in the record.") +
            " The heading is only the address you opened, with hyphens turned into words."}
        </p>
      ) : (
        <p className="lede">{place?.blurb ?? "No summary is attached."}</p>
      )}
      {query.status === "loading" ? <LoadingState /> : null}
      {transportError ? <ErrorState error={query.error} onRetry={query.retry} /> : null}
      <p className="meta-line">
        <span>Postcode {place?.postcode ?? "not recorded"}</span>
        <span>
          Council{" "}
          {place?.council_slug ? (
            <Link to={`/councils/${place.state}/${place.council_slug}`}>
              {place.council_name ?? place.council_slug}
            </Link>
          ) : (
            "not recorded"
          )}
        </span>
        <span>
          Population {place?.population == null ? "not recorded" : formatNumber(place.population)}
        </span>
        <span>Traditional owners {place?.traditional_owners ?? "not recorded"}</span>
      </p>
      <p>{place?.description ?? "No description is attached."}</p>
      {place && place.ranks.length > 0 ? (
        <ul className="rank-list">
          {place.ranks.map((rank) => (
            <li key={rank.list_slug}>
              <Link to={`/rankings/${rank.list_slug}`}>
                {rank.list_title}
                {rank.position == null ? "" : ` · ${rank.position}`}
                {rank.scope ? ` · ${rank.scope}` : ""}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No list position is recorded.</p>
      )}
      <div className="actions">
        <button type="button" className="button-line" onClick={() => void copyLink()}>
          {copied ? "Link copied" : "Copy link"}
        </button>
        <button type="button" className="button-line" onClick={keep} disabled={!place}>
          {kept ? "Kept on this browser" : "Keep"}
        </button>
        <span className="status-line" role="status">
          {copied ? "The address is on the clipboard." : ""}
          {!place && !copied ? "You can keep a place once it is on file." : ""}
        </span>
      </div>
      <SectionNav score={place?.score ?? null} />
      {registry.map((section) => (
        <MetricSection
          key={section.id}
          config={section}
          payload={place?.sections[section.id] ?? null}
          nearby={place?.nearby ?? []}
          origin={place ? { state: place.state, slug: place.slug } : null}
          score={place?.score_detail ?? null}
        />
      ))}
    </main>
  );
}
