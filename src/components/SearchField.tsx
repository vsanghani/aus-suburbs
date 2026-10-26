import { useEffect, useId, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, fetchSearch } from "../api/client";
import type { CouncilSummary, SuburbSummary } from "../api/types";
import { councilPath, suburbPath } from "../lib/places";

export function SearchField({
  initial = "",
  autoFocus = false,
  suggest = true,
  onPick,
}: {
  initial?: string;
  autoFocus?: boolean;
  suggest?: boolean;
  onPick?: (place: SuburbSummary) => void;
}) {
  const navigate = useNavigate();
  const inputId = useId();
  const listId = useId();
  const statusId = useId();
  const [value, setValue] = useState(initial);
  const [result, setResult] = useState<{
    query: string;
    suburbs: SuburbSummary[];
    councils: CouncilSummary[];
    notice: string;
    status: "ready" | "error";
  } | null>(null);
  const query = value.trim();
  const matched = suggest && result?.query === query ? result : null;
  const suburbs = matched?.status === "ready" ? matched.suburbs : [];
  const councils = matched?.status === "ready" ? matched.councils : [];
  const open = suburbs.length > 0 || councils.length > 0;
  const statusText = suggest ? statusMessage(query, matched, suburbs.length, councils.length) : "";

  useEffect(() => {
    if (!suggest || query.length < 2) return undefined;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetchSearch(query, controller.signal)
        .then((response) => {
          if (controller.signal.aborted) return;
          setResult({
            query,
            suburbs: response.results,
            councils: response.councils,
            notice: response.dataset_connected ? "" : response.notice,
            status: "ready",
          });
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setResult({
            query,
            suburbs: [],
            councils: [],
            notice:
              error instanceof ApiError ? error.detail : "The record service did not respond.",
            status: "error",
          });
        });
    }, 200);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, suggest]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitted = value.trim();
    if (!submitted) return;
    if (onPick && suburbs.length === 1 && suburbs[0]) {
      onPick(suburbs[0]);
      return;
    }
    if (!onPick) navigate(`/search?q=${encodeURIComponent(submitted)}`);
  }

  return (
    <form className="search-form" role="search" onSubmit={onSubmit}>
      <label htmlFor={inputId}>Suburb, council, or postcode</label>
      <div className="search-row">
        <input
          id={inputId}
          type="search"
          value={value}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="search"
          aria-autocomplete={suggest ? "list" : undefined}
          aria-controls={suggest ? listId : undefined}
          aria-expanded={suggest ? open : undefined}
          aria-describedby={statusText ? statusId : undefined}
          onChange={(event) => setValue(event.target.value)}
        />
        <button type="submit">Search</button>
      </div>
      {statusText ? (
        <p id={statusId} className="status-line" role="status">
          {statusText}
        </p>
      ) : null}
      {open ? (
        <ul id={listId} className="suggest" aria-label="Matches">
          {suburbs.map((place) => (
            <li key={`s-${place.state}-${place.slug}`}>
              {onPick ? (
                <button type="button" onClick={() => onPick(place)}>
                  <span>{place.name}</span>
                  <span>{place.state.toUpperCase()}</span>
                </button>
              ) : (
                <Link to={suburbPath(place.state, place.slug)}>
                  <span>{place.name}</span>
                  <span>{place.state.toUpperCase()}</span>
                </Link>
              )}
            </li>
          ))}
          {councils.map((council) => (
            <li key={`c-${council.state}-${council.slug}`}>
              <Link to={councilPath(council.state, council.slug)}>
                <span>{council.name}</span>
                <span>Council</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}

function statusMessage(
  query: string,
  matched: { notice: string; status: "ready" | "error" } | null,
  suburbs: number,
  councils: number,
): string {
  if (query.length < 2) return "";
  if (!matched) return "Searching the record.";
  if (matched.status === "error" || matched.notice) return matched.notice;
  if (suburbs === 0 && councils === 0) return "No places matched.";
  const parts: string[] = [];
  if (suburbs > 0) parts.push(`${suburbs} ${suburbs === 1 ? "suburb" : "suburbs"}`);
  if (councils > 0) parts.push(`${councils} ${councils === 1 ? "council" : "councils"}`);
  return `${parts.join(", ")}.`;
}
