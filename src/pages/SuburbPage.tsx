import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, fetchSuburb } from "../api/client";
import { useApi } from "../api/useApi";
import { MetricSection } from "../components/MetricSection";
import { SectionNav } from "../components/SectionNav";
import { ErrorState, LoadingState } from "../components/States";
import { findState } from "../config/geography";
import { formatNumber, humaniseSlug } from "../lib/format";
import { isKeptPlace, subscribeShortlist, toggleKept } from "../lib/shortlist";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { registry } from "../metrics/registry";

export function SuburbPage() {
  const params = useParams();
  const state = (params.state ?? "").toLowerCase();
  const slug = (params.slug ?? "").toLowerCase();
  const query = useApi(`${state}:${slug}`, (signal) => fetchSuburb(state, slug, signal));
  const place = query.status === "ready" ? query.data : null;
  const notOnFile =
    query.status === "error" && query.error instanceof ApiError && query.error.status === 404;
  const title = place?.name ?? humaniseSlug(slug);
  useDocumentTitle(title);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [kept, setKept] = useState(() => isKeptPlace(state, slug));
  const placeKey = `${state}:${slug}`;
  const [trackedPlace, setTrackedPlace] = useState(placeKey);
  if (trackedPlace !== placeKey) {
    setTrackedPlace(placeKey);
    setKept(isKeptPlace(state, slug));
    setCopyState("idle");
  }
  const stateName = findState(state)?.name;

  useEffect(() => subscribeShortlist(() => setKept(isKeptPlace(state, slug))), [state, slug]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  function keep() {
    if (!place) return;
    const next = toggleKept({
      state: place.state,
      slug: place.slug,
      name: place.name,
      savedAt: new Date().toISOString(),
    });
    setKept(next.some((item) => item.state === place.state && item.slug === place.slug));
  }

  return (
    <main className="page" id="content">
      <p className="kicker">
        {query.status === "loading" ? "Fetching" : notOnFile ? "Not on file" : "Suburb"}
        {stateName ? ` · ${stateName}` : ` · ${state}`}
      </p>
      <h1>{title}</h1>
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
      {query.status === "error" && !notOnFile ? (
        <ErrorState error={query.error} onRetry={query.retry} />
      ) : null}
      <dl className="meta-line">
        <div>
          <dt>Postcode</dt>
          <dd>{place?.postcode ?? "not recorded"}</dd>
        </div>
        <div>
          <dt>Council</dt>
          <dd>
            {place?.council_slug ? (
              <Link to={`/councils/${place.state}/${place.council_slug}`}>
                {place.council_name ?? place.council_slug}
              </Link>
            ) : (
              "not recorded"
            )}
          </dd>
        </div>
        <div>
          <dt>Population</dt>
          <dd>{place?.population == null ? "not recorded" : formatNumber(place.population)}</dd>
        </div>
        <div>
          <dt>Traditional owners</dt>
          <dd>{place?.traditional_owners ?? "not recorded"}</dd>
        </div>
      </dl>
      <p>{place?.description ?? "No description is attached."}</p>
      {place && place.ranks.length > 0 ? (
        <ul className="link-index">
          {place.ranks.map((rank) => (
            <li key={rank.list_slug}>
              <Link to={`/rankings/${rank.list_slug}`}>
                <strong>{rank.list_title}</strong>
                <span>
                  {rank.position == null ? "Position not recorded" : `Position ${rank.position}`}
                  {rank.scope ? ` · ${rank.scope}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-line">No list position is recorded.</p>
      )}
      <div className="actions">
        <button type="button" className="button-line" onClick={() => void copyLink()}>
          {copyState === "copied"
            ? "Link copied"
            : copyState === "failed"
              ? "Could not copy"
              : "Copy link"}
        </button>
        <button
          type="button"
          className="button-line"
          onClick={keep}
          disabled={!place}
          aria-pressed={kept}
          aria-describedby={place ? undefined : "keep-hint"}
        >
          {kept ? "Kept on this browser" : "Keep"}
        </button>
        {!place ? <span id="keep-hint">You can keep a place once it is on file.</span> : null}
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
