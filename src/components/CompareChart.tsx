import type { SuburbDetail } from "../api/types";
import { FORMULA } from "../config/formula";
import { chartSeries } from "../lib/compareSeries";
import { formatNumber } from "../lib/format";

const CENTRE = 100;
const RADIUS = 70;
const STROKES = [
  "var(--data-navy)",
  "var(--data-blue)",
  "var(--data-sea)",
  "var(--data-coral)",
] as const;

function polar(index: number, total: number, value: number): [number, number] {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const radius = (Math.min(100, Math.max(0, value)) / 100) * RADIUS;
  const x = CENTRE + Math.cos(angle) * radius;
  const y = CENTRE + Math.sin(angle) * radius;
  return [Number(x.toFixed(1)), Number(y.toFixed(1))];
}

function linePath(values: (number | null)[]): string {
  let path = "";
  let count = 0;
  values.forEach((value, index) => {
    if (value == null) return;
    const [x, y] = polar(index, values.length, value);
    path += `${count === 0 ? "M" : "L"} ${x} ${y} `;
    count += 1;
  });
  return path.trim();
}

export function CompareChart({ tokens, places }: { tokens: string[]; places: SuburbDetail[] }) {
  const series = chartSeries(tokens, places).map((item, index) => ({ ...item, index }));
  const plotted = series.filter((item) => item.values.some((value) => value != null));
  const total = FORMULA.groups.length;
  const ready = plotted.length > 0;
  const label = ready
    ? `Comparison chart for ${plotted.map((item) => item.name).join(", ")}`
    : "Comparison chart with no scores";

  return (
    <figure className="chart">
      <svg viewBox="0 0 200 200" role="img" aria-label={label}>
        {FORMULA.groups.map((group, index) => {
          const [x, y] = polar(index, total, 100);
          return (
            <line
              key={group.id}
              x1={CENTRE}
              y1={CENTRE}
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeWidth="1"
            />
          );
        })}
        <circle
          cx={CENTRE}
          cy={CENTRE}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        {plotted.map((item) => {
          const color = STROKES[item.index % STROKES.length] ?? STROKES[0];
          const complete = item.values.every((value) => value != null);
          if (complete) {
            const points = item.values
              .map((value, index) => {
                const [x, y] = polar(index, total, value ?? 0);
                return `${x},${y}`;
              })
              .join(" ");
            return (
              <polygon
                key={item.token}
                points={points}
                fill={color}
                fillOpacity="0.08"
                stroke={color}
                strokeWidth="1.75"
              />
            );
          }
          return (
            <g key={item.token}>
              <path d={linePath(item.values)} fill="none" stroke={color} strokeWidth="1.75" />
              {item.values.map((value, index) => {
                if (value == null) return null;
                const [x, y] = polar(index, total, value);
                return <circle key={index} cx={x} cy={y} r="2.4" fill={color} />;
              })}
            </g>
          );
        })}
      </svg>
      <figcaption>
        {ready
          ? "Chart values are 0–100 positions supplied with the composite. They are not the points themselves. A missing driver is not drawn, and it is not treated as zero."
          : "The chart draws when a place has a 0–100 chart value on a driver. None are loaded."}
      </figcaption>
      {ready ? (
        <>
          <ul className="chart-legend">
            {plotted.map((item) => {
              const color = STROKES[item.index % STROKES.length] ?? STROKES[0];
              return (
                <li key={item.token}>
                  <svg className="swatch" viewBox="0 0 28 8" aria-hidden="true">
                    <line x1="0" y1="4" x2="28" y2="4" stroke={color} strokeWidth="3" />
                  </svg>
                  {item.name}
                </li>
              );
            })}
          </ul>
          <ol className="spoke-list">
            {FORMULA.groups.map((group, index) => (
              <li key={group.id}>
                <span className="idx">{String(index + 1).padStart(2, "0")}</span>
                <span>{group.label}</span>
              </li>
            ))}
          </ol>
          <table className="sr-only">
            <caption>Chart values from 0 to 100. Missing drivers are not scored.</caption>
            <thead>
              <tr>
                <th scope="col">Driver</th>
                {plotted.map((item) => (
                  <th key={item.token} scope="col">
                    {item.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FORMULA.groups.map((group, index) => (
                <tr key={group.id}>
                  <th scope="row">{group.label}</th>
                  {plotted.map((item) => {
                    const value = item.values[index];
                    return (
                      <td key={item.token}>{value == null ? "Not scored" : formatNumber(value)}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </figure>
  );
}
