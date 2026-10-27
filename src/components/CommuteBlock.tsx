import { useState, type FormEvent } from "react";
import { ApiError, fetchCommute } from "../api/client";
import type { CommuteResponse } from "../api/types";
import { ErrorState } from "./States";

const MODE_LABEL: Record<CommuteResponse["modes"][number]["mode"], string> = {
  transit: "Public transport",
  drive: "Drive",
  cycle: "Cycle",
  walk: "Walk",
};

export function CommuteBlock({ origin }: { origin: { state: string; slug: string } | null }) {
  const [destination, setDestination] = useState("");
  const [result, setResult] = useState<CommuteResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  async function estimate(target: string) {
    if (!origin || target.trim() === "") return;
    setPending(true);
    setError(null);
    try {
      setResult(await fetchCommute(origin.state, origin.slug, target.trim()));
    } catch (caught) {
      if (!(caught instanceof DOMException && caught.name === "AbortError")) setError(caught);
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void estimate(destination);
  }

  if (!origin) {
    return <p className="empty-line">Travel times start from a place that is on file.</p>;
  }

  return (
    <form onSubmit={onSubmit} aria-busy={pending}>
      <label className="field">
        Destination
        <input
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
          placeholder="Street, station, or workplace"
          autoComplete="off"
          enterKeyHint="go"
        />
      </label>
      <button
        type="submit"
        className="button-solid"
        disabled={pending || destination.trim() === ""}
      >
        {pending ? "Asking…" : "Estimate"}
      </button>
      {error ? (
        <ErrorState
          error={error instanceof ApiError ? error : error}
          onRetry={() => void estimate(destination)}
        />
      ) : null}
      {result ? (
        <div>
          <p>{result.notice}</p>
          <ul className="metric-rows">
            {result.modes.map((mode) => (
              <li key={mode.mode}>
                <span>{MODE_LABEL[mode.mode]}</span>
                <strong className="num">
                  {mode.minutes == null ? "—" : `${mode.minutes} min`}
                </strong>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </form>
  );
}
