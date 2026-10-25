import type { ScoreDetail } from "../api/types";
import { FORMULA } from "../config/formula";
import { formatNumber, formatSigned } from "../lib/format";
import { tierFor } from "../lib/score";

export function ScoreBlock({ score }: { score: ScoreDetail | null }) {
  const value = score?.value ?? null;
  const tier = score?.tier ?? tierFor(value, FORMULA.tiers);
  const drivers = score?.drivers ?? [];
  return (
    <div>
      <div className="score-head">
        <span className="score-number">{value == null ? "—" : formatNumber(value)}</span>
        <span className="score-tier">{tier ?? "Unscored"}</span>
      </div>
      <div className="measure" aria-hidden="true">
        {value != null ? (
          <i style={{ left: `calc(${Math.min(100, Math.max(0, value))}% - 7px)` }} />
        ) : null}
      </div>
      <p>
        Base {formatNumber(score?.base ?? FORMULA.base)}. Ceiling {formatNumber(FORMULA.ceiling)}.
        The status of this arithmetic is {FORMULA.status}.
      </p>
      {value == null ? (
        <p className="empty-line">The composite is not calculated for this place.</p>
      ) : null}
      <ol className="driver-list">
        {FORMULA.groups.map((group) => {
          const driver = drivers.find((item) => item.id === group.id);
          const positive = group.direction === "positive";
          return (
            <li key={group.id}>
              <span className={positive ? "direction positive" : "direction negative"}>
                {positive ? "Adds" : "Subtracts"}
              </span>
              <span>
                {group.label}
                <small style={{ display: "block", color: "var(--faint)" }}>
                  Draft ceiling {formatNumber(group.draft_max_points)}
                  {driver?.context ? ` · ${driver.context}` : ""}
                </small>
              </span>
              <span className="driver-points">
                {driver?.points == null ? "Not scored" : formatSigned(driver.points)}
              </span>
            </li>
          );
        })}
      </ol>
      <p>
        <a href="/methodology">How the composite is drafted</a>
      </p>
    </div>
  );
}
