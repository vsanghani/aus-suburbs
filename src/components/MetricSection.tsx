import type { ScoreDetail, SectionPayload, SuburbSummary } from "../api/types";
import type { SectionConfig } from "../metrics/registry";
import { CommuteBlock } from "./CommuteBlock";
import { MetricsBlock } from "./MetricsBlock";
import { NearbyBlock } from "./NearbyBlock";
import { ScoreBlock } from "./ScoreBlock";
import { SourceNote } from "./SourceNote";

export function MetricSection({
  config,
  payload,
  nearby,
  origin,
  score,
}: {
  config: SectionConfig;
  payload: SectionPayload | null;
  nearby: SuburbSummary[];
  origin: { state: string; slug: string } | null;
  score: ScoreDetail | null;
}) {
  const kind = config.kind ?? "metrics";
  return (
    <section
      id={config.id}
      className="metric-section"
      tabIndex={-1}
      aria-labelledby={`${config.id}-title`}
    >
      <p className="kicker">{config.kicker}</p>
      <h2 id={`${config.id}-title`}>{config.title}</h2>
      <p className="lede">{config.lede}</p>
      {config.aside ? <p className="aside">{config.aside}</p> : null}
      {payload?.narrative ? <p>{payload.narrative}</p> : null}
      {kind === "score" ? <ScoreBlock score={score} /> : null}
      {kind === "commute" ? <CommuteBlock origin={origin} /> : null}
      {kind === "nearby" ? <NearbyBlock places={nearby} /> : null}
      {kind === "metrics" ? <MetricsBlock config={config} payload={payload} /> : null}
      {kind === "score" ? null : <SourceNote source={payload?.source} />}
    </section>
  );
}
