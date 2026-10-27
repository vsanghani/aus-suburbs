import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SuburbDetail } from "../api/types";
import { chartSeries, hasChartValue } from "../lib/compareSeries";
import { CompareChart } from "./CompareChart";

function place(drivers: { id: string; chart_value: number | null }[]): SuburbDetail {
  return {
    state: "vic",
    slug: "richmond",
    name: "Richmond",
    score_detail: {
      value: null,
      tier: null,
      base: 50,
      drivers: drivers.map((driver) => ({
        id: driver.id,
        label: driver.id,
        direction: "positive",
        points: null,
        raw_value: null,
        raw_unit: null,
        context: null,
        chart_value: driver.chart_value,
      })),
    },
  } as SuburbDetail;
}

describe("CompareChart", () => {
  it("explains an empty chart", () => {
    render(<CompareChart tokens={[]} places={[]} />);
    expect(screen.getByText(/None are loaded/)).toBeInTheDocument();
  });

  it("keeps a missing chart value as not scored", () => {
    const series = chartSeries(
      ["vic:richmond"],
      [
        place([
          { id: "transport", chart_value: 80 },
          { id: "education", chart_value: null },
        ]),
      ],
    );
    expect(hasChartValue(series)).toBe(true);
    expect(series[0]?.values[0]).toBe(80);
    expect(series[0]?.values[1]).toBeNull();
    expect(series[0]?.values.includes(0)).toBe(false);
  });
});
