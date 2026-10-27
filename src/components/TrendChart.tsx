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
  const height = 220;
  const padX = 28;
  const padTop = 18;
  const padBottom = 32;
  let path = "";
  let area = "";
  let referenceY: number | null = null;
  let firstYear: number | null = null;
  let lastYear: number | null = null;
  if (usable.length >= 2) {
    const values = usable.map((point) => point.value);
    if (referenceValue != null) values.push(referenceValue);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const xFor = (index: number) => padX + (index / (usable.length - 1)) * (width - padX * 2);
    const yFor = (value: number) =>
      height - padBottom - ((value - min) / span) * (height - padTop - padBottom);
    path = usable
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"} ${xFor(index).toFixed(1)} ${yFor(point.value).toFixed(1)}`,
      )
      .join(" ");
    const start = usable[0];
    const end = usable[usable.length - 1];
    if (start && end) {
      firstYear = start.year;
      lastYear = end.year;
      area = `${path} L ${xFor(usable.length - 1).toFixed(1)} ${(height - padBottom).toFixed(1)} L ${xFor(0).toFixed(1)} ${(height - padBottom).toFixed(1)} Z`;
    }
    if (referenceValue != null) referenceY = yFor(referenceValue);
  }

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
        {referenceY != null ? (
          <line
            x1={padX}
            x2={width - padX}
            y1={referenceY}
            y2={referenceY}
            stroke="currentColor"
            strokeDasharray="4 4"
            opacity="0.45"
          />
        ) : null}
        {area ? <path d={area} fill="var(--data-teal)" opacity="0.12" /> : null}
        {path ? (
          <path d={path} fill="none" stroke="var(--data-teal)" strokeWidth="2.25" />
        ) : (
          <text x={padX} y={height / 2} fill="currentColor" fontSize="14">
            No series
          </text>
        )}
        {firstYear != null && lastYear != null ? (
          <>
            <text x={padX} y={height - 10} fill="currentColor" fontSize="12">
              {firstYear}
            </text>
            <text
              x={width - padX}
              y={height - 10}
              fill="currentColor"
              fontSize="12"
              textAnchor="end"
            >
              {lastYear}
            </text>
          </>
        ) : null}
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
