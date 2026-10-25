import type { SeriesPoint } from "../api/types";
import { formatNumber } from "../lib/format";

export function TrendChart({
  label,
  unit,
  points,
  referenceLabel,
  referenceValue,
  narrative,
}: {
  label: string;
  unit?: string | null;
  points: SeriesPoint[];
  referenceLabel?: string | null;
  referenceValue?: number | null;
  narrative?: string | null;
}) {
  const usable = points.filter(
    (point): point is { year: number; value: number } => point.value != null,
  );
  const width = 640;
  const height = 200;
  const pad = 16;
  let path = "";
  let referenceY: number | null = null;
  if (usable.length >= 2) {
    const values = usable.map((point) => point.value);
    if (referenceValue != null) values.push(referenceValue);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const xFor = (index: number) => pad + (index / (usable.length - 1)) * (width - pad * 2);
    const yFor = (value: number) => height - pad - ((value - min) / span) * (height - pad * 2);
    path = usable
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"} ${xFor(index).toFixed(1)} ${yFor(point.value).toFixed(1)}`,
      )
      .join(" ");
    if (referenceValue != null) referenceY = yFor(referenceValue);
  }

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
        {referenceY != null ? (
          <line
            x1={pad}
            x2={width - pad}
            y1={referenceY}
            y2={referenceY}
            stroke="currentColor"
            strokeDasharray="4 4"
            opacity="0.45"
          />
        ) : null}
        {path ? (
          <path d={path} fill="none" stroke="var(--terracotta)" strokeWidth="2" />
        ) : (
          <text x={pad} y={height / 2} fill="currentColor" fontSize="14">
            No series
          </text>
        )}
      </svg>
      <figcaption>
        {usable.length < 2
          ? `${label}: no series is loaded.`
          : (narrative ?? `No sentence has been written for ${label}.`)}
        {referenceLabel && referenceValue != null
          ? ` ${referenceLabel}: ${formatNumber(referenceValue)}${unit ? ` ${unit}` : ""}.`
          : ""}
      </figcaption>
      {usable.length >= 2 ? (
        <table className="sr-only">
          <caption>{label}</caption>
          <thead>
            <tr>
              <th>Year</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {usable.map((point) => (
              <tr key={point.year}>
                <td>{point.year}</td>
                <td>{formatNumber(point.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </figure>
  );
}
