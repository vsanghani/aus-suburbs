import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchMatch } from "../api/client";
import { useApi } from "../api/useApi";
import { FilterPills } from "../components/FilterPills";
import { PageIntro } from "../components/PageIntro";
import { DatasetNotice, ErrorState, LoadingState } from "../components/States";
import { STATES } from "../config/geography";
import { formatShare } from "../lib/format";
import { suburbPath } from "../lib/places";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { normaliseWeights, PRESETS, readWeights, WEIGHTS, type WeightValues } from "../lib/weights";

export function MatchPage() {
  const [params, setParams] = useSearchParams();
  useDocumentTitle("Match");
  const [values, setValues] = useState<WeightValues>(() => readWeights(params));
  const [budgetWeekly, setBudgetWeekly] = useState(params.get("budget_weekly") ?? "");
  const [commuteTo, setCommuteTo] = useState(params.get("commute_to") ?? "");
  const [needsSchools, setNeedsSchools] = useState(params.get("needs_schools") === "true");
  const [stateCode, setStateCode] = useState(params.get("state") ?? "all");
  const normalised = normaliseWeights(values);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams();
      for (const weight of WEIGHTS) next.set(weight.id, String(values[weight.id] ?? 50));
      if (budgetWeekly.trim()) next.set("budget_weekly", budgetWeekly.trim());
      if (commuteTo.trim()) next.set("commute_to", commuteTo.trim());
      if (needsSchools) next.set("needs_schools", "true");
      if (stateCode !== "all") next.set("state", stateCode);
      setParams(next, { replace: true });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [values, budgetWeekly, commuteTo, needsSchools, stateCode, setParams]);

  const query = useApi(params.toString(), (signal) => fetchMatch(params, signal));

  return (
    <main className="page" id="content">
      <PageIntro
        kicker="Weights"
        title="Match"
        lede="Move the sliders. The list re-ranks suburbs by the mix you set, once scores exist."
      />
      <div className="pills" role="group" aria-label="Starting mixes">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="pill"
            onClick={() => setValues(preset.values)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="stack" aria-hidden="true">
        {WEIGHTS.map((weight) => (
          <i key={weight.id} style={{ width: formatShare(normalised[weight.id] ?? 0) }} />
        ))}
      </div>
      <p>
        The bar is your mix, normalised to 100. The address keeps it, so the link can be shared.
      </p>
      {WEIGHTS.map((weight) => (
        <div className="slider-row" key={weight.id}>
          <label htmlFor={`weight-${weight.id}`}>{weight.label}</label>
          <input
            id={`weight-${weight.id}`}
            type="range"
            min={0}
            max={100}
            value={values[weight.id] ?? 50}
            onChange={(event) =>
              setValues((current) => ({ ...current, [weight.id]: Number(event.target.value) }))
            }
          />
          <span className="num">{formatShare(normalised[weight.id] ?? 0)}</span>
          <p>{weight.help}</p>
        </div>
      ))}
      <label className="field">
        Weekly housing budget, optional
        <input
          inputMode="numeric"
          value={budgetWeekly}
          onChange={(event) => setBudgetWeekly(event.target.value.replace(/[^\d]/g, ""))}
        />
      </label>
      <label className="field">
        Commute toward
        <input value={commuteTo} onChange={(event) => setCommuteTo(event.target.value)} />
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={needsSchools}
          onChange={(event) => setNeedsSchools(event.target.checked)}
        />
        Needs schools or early learning
      </label>
      <FilterPills
        label="Limit to a state"
        value={stateCode}
        onChange={setStateCode}
        options={[
          { id: "all", label: "All states" },
          ...STATES.map((state) => ({ id: state.code, label: state.name })),
        ]}
      />
      {query.status === "loading" ? <LoadingState label="Sending the weights." /> : null}
      {query.status === "error" ? <ErrorState error={query.error} onRetry={query.retry} /> : null}
      {query.status === "ready" ? (
        query.data.dataset_connected && query.data.results.length > 0 ? (
          <ol className="link-index">
            {query.data.results.map((place, index) => (
              <li key={`${place.state}-${place.slug}`}>
                <Link to={suburbPath(place.state, place.slug)}>
                  <strong>
                    {index + 1}. {place.name}
                  </strong>
                  <span>{place.state.toUpperCase()}</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <DatasetNotice
            connected={query.data.dataset_connected}
            notice={query.data.notice}
            emptyTitle="Nothing ranked"
            emptyBody="The weights matched no suburbs."
          />
        )
      ) : null}
    </main>
  );
}
