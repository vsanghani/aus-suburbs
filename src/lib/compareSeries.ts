import type { SuburbDetail } from "../api/types";
import { FORMULA } from "../config/formula";
import { humaniseSlug } from "./format";
import { splitToken } from "./places";

export type ChartSeries = {
  token: string;
  name: string;
  values: (number | null)[];
};

export function chartSeries(tokens: string[], places: SuburbDetail[]): ChartSeries[] {
  return tokens.map((token) => {
    const { state, slug } = splitToken(token);
    const place = places.find((item) => item.state === state && item.slug === slug);
    const drivers = place?.score_detail?.drivers ?? [];
    return {
      token,
      name: place?.name ?? humaniseSlug(slug),
      values: FORMULA.groups.map((group) => {
        const driver = drivers.find((item) => item.id === group.id);
        return driver?.chart_value ?? null;
      }),
    };
  });
}

export function hasChartValue(series: ChartSeries[]): boolean {
  return series.some((item) => item.values.some((value) => value != null));
}
