import { useEffect, useId, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, fetchSearch } from "../api/client";
import type { CouncilSummary, SuburbSummary } from "../api/types";
import { councilPath, suburbPath } from "../lib/places";
import { searchCanonicalPath } from "../seo/urls";
import { Icon } from "./Icon";

export function SearchField({
  initial = "",
  autoFocus = false,
  onPick,
}: {
  initial?: string;
  autoFocus?: boolean;
  onPick?: (place: SuburbSummary) => void;
}) {
  const navigate = useNavigate();
  const inputId = useId();
  const [value, setValue] = useState(initial);
  const [result, setResult] = useState<{
    query: string;
    suburbs: SuburbSummary[];
    councils: CouncilSummary[];
    notice: string;
    status: "ready" | "error";
  } | null>(null);
  const query = value.trim();
  const matched = result?.query === query ? result : null;
  const suburbs = matched?.status === "ready" ? matched.suburbs : [];
  const councils = matched?.status === "ready" ? matched.councils : [];
  const notice = matched?.notice ?? "";
  const status = query.length < 2 ? "idle" : matched ? matched.status : "loading";

  useEffect(() => {
    if (query.length < 2) return undefined;
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
  }, [query]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = value.trim();
    if (!query) return;
    if (onPick && suburbs.length === 1 && suburbs[0]) {
      onPick(suburbs[0]);
      return;
    }
    if (!onPick) navigate(searchCanonicalPath(query));
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
          enterKeyHint="search"
          spellCheck={false}
          onChange={(event) => setValue(event.target.value)}
        />
        <button type="submit">
          <Icon name="search" />
          Search
        </button>
      </div>
      <p className="status-line" role="status">
        {status === "loading" ? "Searching the record." : notice}
      </p>
      {suburbs.length > 0 || councils.length > 0 ? (
        <ul className="suggest">
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
