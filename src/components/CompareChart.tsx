import type { SuburbDetail } from "../api/types";
import { FORMULA } from "../config/formula";
import { chartSeries } from "../lib/compareSeries";
import { formatNumber } from "../lib/format";

const CENTRE = 100;
const RADIUS = 70;

const SERIES = [
  { color: "var(--terracotta)", dash: undefined },
  { color: "var(--ochre)", dash: "4 3" },
  { color: "var(--sage)", dash: "1.5 2" },
  { color: "var(--ink)", dash: "7 3 1.5 3" },
] as const;

function polar(index: number, total: number, value: number): [number, number] {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const radius = (Math.min(100, Math.max(0, value)) / 100) * RADIUS;
  const x = CENTRE + Math.cos(angle) * radius;
  const y = CENTRE + Math.sin(angle) * radius;
  return [Number(x.toFixed(1)), Number(y.toFixed(1))];
}

function linePaths(values: (number | null)[]): string[] {
  const total = values.length;
  const paths: string[] = [];
  let current = "";
  let count = 0;
  const flush = () => {
    if (count > 1) paths.push(current);
    current = "";
    count = 0;
  };
  for (let index = 0; index < total; index += 1) {
    const value = values[index];
    if (value == null) {
      flush();
      continue;
    }
    const [x, y] = polar(index, total, value);
    current += `${count === 0 ? "M" : "L"} ${x} ${y} `;
    count += 1;
  }
  flush();
  const closed = paths[0];
  if (closed && values.every((value) => value != null) && paths.length === 1) {
    paths[0] = `${closed} Z`;
  }
  return paths;
}

export function CompareChart({ tokens, places }: { tokens: string[]; places: SuburbDetail[] }) {
  const series = chartSeries(tokens, places);
  const plotted = series.filter((item) => item.values.some((value) => value != null));
  const total = FORMULA.groups.length;
  const ready = plotted.length > 0;

  return (
    <figure className="chart">
      <svg
        viewBox="0 0 200 200"
        role="img"
        aria-label={
          ready
            ? "Comparison of chart values. Spokes start at the top and run clockwise."
            : "Comparison chart with no scores"
        }
      >
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
        {(ready ? [0.25, 0.5, 0.75, 1] : [1]).map((scale) => (
          <circle
            key={scale}
            cx={CENTRE}
            cy={CENTRE}
            r={RADIUS * scale}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity={scale === 1 ? 1 : 0.35}
          />
        ))}
        {plotted.map((item, seriesIndex) => {
          const style = SERIES[seriesIndex % SERIES.length] ?? SERIES[0];
          return (
            <g key={item.token}>
              {linePaths(item.values).map((path) => (
                <path
                  key={path}
                  d={path}
                  fill="none"
                  stroke={style.color}
                  strokeWidth="1.75"
                  strokeDasharray={style.dash}
                />
              ))}
              {item.values.map((value, index) => {
                if (value == null) return null;
                const [x, y] = polar(index, total, value);
                return <circle key={index} cx={x} cy={y} r="2.4" fill={style.color} />;
              })}
            </g>
          );
        })}
      </svg>
      {ready ? (
        <>
          <figcaption>
            A longer radius is a higher chart value, from 0 at the centre to 100 at the ring. A
            missing driver is not drawn, and it is not treated as zero.
          </figcaption>
          <ul className="chart-legend">
            {plotted.map((item, index) => {
              const style = SERIES[index % SERIES.length] ?? SERIES[0];
              return (
                <li key={item.token}>
                  <svg className="swatch" viewBox="0 0 28 8" aria-hidden="true">
                    <line
                      x1="0"
                      y1="4"
                      x2="28"
                      y2="4"
                      stroke={style.color}
                      strokeWidth="2"
                      strokeDasharray={style.dash}
                    />
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
      ) : (
        <figcaption>
          The chart draws when a place has a 0–100 chart value on a driver. None are loaded.
        </figcaption>
      )}
    </figure>
  );
}
