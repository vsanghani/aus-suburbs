import { useState, type KeyboardEvent } from "react";
import type { DataTable, MetricValue, SectionPayload, TimeSeries } from "../api/types";
import { formatDistance, formatValue } from "../lib/format";
import type { SectionConfig } from "../metrics/registry";
import { TrendChart } from "./TrendChart";

function inGroup<T extends { group?: string | null }>(
  items: T[],
  tab: string,
  hasTabs: boolean,
): T[] {
  if (!hasTabs) return items;
  return items.filter((item) => item.group == null || item.group === "" || item.group === tab);
}

export function MetricsBlock({
  config,
  payload,
}: {
  config: SectionConfig;
  payload: SectionPayload | null;
}) {
  const tabs = config.tabs ?? [];
  const hasTabs = tabs.length > 0;
  const [tab, setTab] = useState(tabs[0]?.id ?? "");
  const metrics = payload?.metrics ?? [];
  const series = payload?.series ?? [];
  const tables = payload?.tables ?? [];
  const places = payload?.places ?? [];
  const slotRows = metricRows(config, metrics, tab, hasTabs);
  const seriesRows = seriesRowsFor(config, series, tab, hasTabs);
  const tableRows = tableRowsFor(config, tables, tab, hasTabs);
  const filled =
    metrics.some((metric) => metric.value != null) ||
    series.some((item) => item.points.length > 0) ||
    places.length > 0 ||
    tables.some((table) => table.rows.length > 0);

  return (
    <div>
      {hasTabs ? (
        <div
          className="tabs"
          role="tablist"
          aria-label={config.title}
          onKeyDown={(event) => onTabKey(event, tabs, tab, setTab)}
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${config.id}-${item.id}-tab`}
              aria-selected={item.id === tab}
              aria-controls={`${config.id}-${item.id}-panel`}
              tabIndex={item.id === tab ? 0 : -1}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      <div
        role={hasTabs ? "tabpanel" : undefined}
        id={hasTabs ? `${config.id}-${tab}-panel` : undefined}
      >
        {filled ? null : <p className="empty-line">No figures are on file for this section.</p>}
        {slotRows.length > 0 ? (
          <ul className="metric-rows">
            {slotRows.map((row) => (
              <li key={row.id}>
                <span>{row.label}</span>
                <strong className="num">{formatValue(row.value, row.unit)}</strong>
                {row.context ? <small>{row.context}</small> : null}
              </li>
            ))}
          </ul>
        ) : null}
        {seriesRows.map((item) => (
          <TrendChart
            key={item.id}
            label={item.label}
            unit={item.unit}
            points={item.points}
            referenceLabel={item.referenceLabel}
            referenceValue={item.referenceValue}
            narrative={item.narrative}
          />
        ))}
        {tableRows.map((table) => (
          <table className="data" key={table.id}>
            <caption>{table.label}</caption>
            <thead>
              <tr>
                {table.columns.map((column) => (
                  <th key={column.id} scope="col">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.length === 0 ? (
                <tr>
                  <td colSpan={Math.max(table.columns.length, 1)}>No rows are loaded.</td>
                </tr>
              ) : (
                table.rows.map((row, index) => (
                  <tr key={`${table.id}-${index}`}>
                    {table.columns.map((column) => (
                      <td key={column.id}>{row[column.id] ?? "—"}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ))}
        {(config.placeGroups ?? []).map((group) => {
          const grouped = places.filter((place) => place.group === group.id);
          return (
            <div className="place-group" key={group.id}>
              <h3>{group.label}</h3>
              {grouped.length === 0 ? (
                <p className="empty-line">None listed.</p>
              ) : (
                <ul>
                  {grouped.map((place) => (
                    <li key={place.id}>
                      <span>
                        {place.name}
                        {place.detail ? ` · ${place.detail}` : ""}
                        {place.sector ? ` · ${place.sector}` : ""}
                      </span>
                      <span className="num">{formatDistance(place.distance_m)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {(payload?.notes ?? []).map((note) => (
          <p key={note} className="aside">
            {note}
          </p>
        ))}
      </div>
    </div>
  );
}

type Row = {
  id: string;
  label: string;
  value: number | string | null;
  unit?: string | null;
  context?: string | null;
};

function metricRows(
  config: SectionConfig,
  metrics: MetricValue[],
  tab: string,
  hasTabs: boolean,
): Row[] {
  const slots = inGroup(config.slots ?? [], tab, hasTabs);
  const incoming = inGroup(metrics, tab, hasTabs);
  const byId = new Map(incoming.map((metric) => [metric.id, metric]));
  const seen = new Set<string>();
  const rows: Row[] = slots.map((slot) => {
    seen.add(slot.id);
    const metric = byId.get(slot.id);
    const context = metric?.context_value
      ? `${metric.context_label ?? slot.context ?? "Context"} ${metric.context_value}`
      : (slot.context ?? null);
    return {
      id: slot.id,
      label: metric?.label ?? slot.label,
      value: metric?.value ?? null,
      unit: metric?.unit ?? slot.unit,
      context,
    };
  });
  for (const metric of incoming) {
    if (seen.has(metric.id)) continue;
    rows.push({
      id: metric.id,
      label: metric.label,
      value: metric.value,
      unit: metric.unit,
      context: metric.context_value
        ? `${metric.context_label ?? "Context"} ${metric.context_value}`
        : metric.note,
    });
  }
  return rows;
}

function seriesRowsFor(config: SectionConfig, series: TimeSeries[], tab: string, hasTabs: boolean) {
  const slots = inGroup(config.series ?? [], tab, hasTabs);
  const incoming = inGroup(series, tab, hasTabs);
  const byId = new Map(incoming.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const rows = slots.map((slot) => {
    seen.add(slot.id);
    const item = byId.get(slot.id);
    return {
      id: slot.id,
      label: item?.label ?? slot.label,
      unit: item?.unit ?? slot.unit,
      points: item?.points ?? [],
      referenceLabel: item?.reference_label,
      referenceValue: item?.reference_value,
      narrative: item?.narrative,
    };
  });
  for (const item of incoming) {
    if (seen.has(item.id)) continue;
    rows.push({
      id: item.id,
      label: item.label,
      unit: item.unit ?? undefined,
      points: item.points,
      referenceLabel: item.reference_label ?? undefined,
      referenceValue: item.reference_value ?? undefined,
      narrative: item.narrative ?? undefined,
    });
  }
  return rows;
}

function tableRowsFor(config: SectionConfig, tables: DataTable[], tab: string, hasTabs: boolean) {
  const slots = (config.tables ?? []).filter(
    (table) => !hasTabs || table.group == null || table.group === tab,
  );
  const incoming = inGroup(tables, tab, hasTabs);
  const byId = new Map(incoming.map((table) => [table.id, table]));
  const seen = new Set<string>();
  const rows = slots.map((slot) => {
    seen.add(slot.id);
    const table = byId.get(slot.id);
    return {
      id: slot.id,
      label: table?.label ?? slot.label,
      columns: table?.columns?.length ? table.columns : slot.columns,
      rows: table?.rows ?? [],
    };
  });
  for (const table of incoming) {
    if (seen.has(table.id)) continue;
    rows.push({ id: table.id, label: table.label, columns: table.columns, rows: table.rows });
  }
  return rows;
}

function onTabKey(
  event: KeyboardEvent<HTMLDivElement>,
  tabs: { id: string }[],
  tab: string,
  setTab: (id: string) => void,
) {
  const index = tabs.findIndex((item) => item.id === tab);
  if (index < 0) return;
  let next: number;
  if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
  else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
  else return;
  event.preventDefault();
  const id = tabs[next]?.id;
  if (!id) return;
  setTab(id);
  event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
}
