import { useSearchParams } from "react-router-dom";
import { fetchCompare } from "../api/client";
import type { SuburbDetail } from "../api/types";
import { useApi } from "../api/useApi";
import { PageIntro } from "../components/PageIntro";
import { SearchField } from "../components/SearchField";
import { DatasetNotice, ErrorState, LoadingState } from "../components/States";
import { FORMULA } from "../config/formula";
import { formatValue, humaniseSlug } from "../lib/format";
import { parsePlaceTokens, splitToken, suburbPath } from "../lib/places";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { registry } from "../metrics/registry";

export function ComparePage() {
  const [params, setParams] = useSearchParams();
  const tokens = parsePlaceTokens(params);
  useDocumentTitle("Compare");
  const key = tokens.join("|");
  const query = useApi(`compare:${key}`, (signal) => fetchCompare(tokens, signal));

  function addPlace(state: string, slug: string) {
    const token = `${state}:${slug}`;
    if (tokens.includes(token) || tokens.length >= 4) return;
    const next = new URLSearchParams(params);
    next.append("p", token);
    setParams(next);
  }

  function removePlace(token: string) {
    const next = new URLSearchParams();
    for (const item of tokens) {
      if (item !== token) next.append("p", item);
    }
    setParams(next);
  }

  const places = query.status === "ready" ? query.data.places : [];

  return (
    <main className="page" id="content">
      <PageIntro
        kicker="Side by side"
        title="Compare"
        lede="Up to four suburbs, the same rows. Nothing is blended into a winner."
      />
      {tokens.length >= 4 ? (
        <p>Four places is the limit.</p>
      ) : (
        <SearchField onPick={(place) => addPlace(place.state, place.slug)} />
      )}
      <div className="seats">
        {[0, 1, 2, 3].map((index) => {
          const token = tokens[index];
          if (!token) {
            return (
              <div className="seat" key={index}>
                <span>Seat {index + 1}</span>
                Empty
              </div>
            );
          }
          const { state, slug } = splitToken(token);
          const loaded = places.find((place) => place.state === state && place.slug === slug);
          return (
            <div className="seat" key={token}>
              <span>Seat {index + 1}</span>
              <strong>{loaded?.name ?? humaniseSlug(slug)}</strong>
              <small>{loaded ? state.toUpperCase() : "Not on file"}</small>
              <button type="button" className="button-line" onClick={() => removePlace(token)}>
                Remove
              </button>
            </div>
          );
        })}
      </div>
      {query.status === "loading" ? <LoadingState /> : null}
      {query.status === "error" ? <ErrorState error={query.error} onRetry={query.retry} /> : null}
      {query.status === "ready" && query.data.omitted.length > 0 ? (
        <p>Left off: {query.data.omitted.join(", ")}.</p>
      ) : null}
      {query.status === "ready" ? (
        <DatasetNotice
          connected={query.data.dataset_connected}
          notice={query.data.notice}
          emptyTitle="Nothing to compare"
          emptyBody="The places returned no figures."
        />
      ) : null}
      <table className="data">
        <caption>
          {tokens.length === 0
            ? "The table gains a column for each place you add."
            : "Rows stay blank until each place is on file."}
        </caption>
        <thead>
          <tr>
            <th scope="col">Figure</th>
            {tokens.map((token) => {
              const { state, slug } = splitToken(token);
              return (
                <th key={token} scope="col">
                  <a href={suburbPath(state, slug)}>{humaniseSlug(slug)}</a>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{FORMULA.score_label}</th>
            {tokens.map((token) => (
              <td key={token} className="num">
                {cellScore(places, token)}
              </td>
            ))}
          </tr>
        </tbody>
        {registry
          .filter((section) => (section.slots?.length ?? 0) > 0)
          .map((section) => (
            <tbody key={section.id}>
              <tr className="group-row">
                <th colSpan={tokens.length + 1} scope="colgroup">
                  {section.title}
                </th>
              </tr>
              {(section.slots ?? []).map((slot) => (
                <tr key={slot.id}>
                  <th scope="row">{slot.label}</th>
                  {tokens.map((token) => (
                    <td key={token} className="num">
                      {cellMetric(places, token, section.id, slot.id, slot.unit)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
      </table>
      <figure className="chart">
        <svg viewBox="0 0 200 200" role="img" aria-label="Comparison chart with no scores">
          {FORMULA.groups.map((group, index) => {
            const angle = (Math.PI * 2 * index) / FORMULA.groups.length - Math.PI / 2;
            const x = 100 + Math.cos(angle) * 70;
            const y = 100 + Math.sin(angle) * 70;
            return (
              <line
                key={group.id}
                x1="100"
                y1="100"
                x2={x}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
              />
            );
          })}
          <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
        <figcaption>
          The chart needs two places with a 0–100 chart value on each driver. None are loaded.
        </figcaption>
      </figure>
    </main>
  );
}

function placeFor(places: SuburbDetail[], token: string): SuburbDetail | undefined {
  const { state, slug } = splitToken(token);
  return places.find((place) => place.state === state && place.slug === slug);
}

function cellScore(places: SuburbDetail[], token: string): string {
  const place = placeFor(places, token);
  if (!place || place.score == null) return "—";
  return formatValue(place.score);
}

function cellMetric(
  places: SuburbDetail[],
  token: string,
  sectionId: string,
  slotId: string,
  unit?: string,
): string {
  const place = placeFor(places, token);
  const metric = place?.sections[sectionId]?.metrics.find((item) => item.id === slotId);
  if (!metric) return "—";
  return formatValue(metric.value, metric.unit ?? unit);
}
