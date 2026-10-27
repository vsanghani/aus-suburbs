import { ApiError } from "../api/client";
import type {
  CompareResponse,
  CouncilDetail,
  ExploreResponse,
  ExportResponse,
  MatchResponse,
  MethodologyResponse,
  RankingResponse,
  SearchResponse,
  StateDetail,
  SuburbDetail,
} from "../api/types";
import type { QuerySeed } from "../api/useApi";

export type ResourcePayload<T> =
  | { key: string; status: "ready"; data: T }
  | { key: string; status: "error"; statusCode: number; detail: string };

export type SuburbPayload = ResourcePayload<SuburbDetail>;

export type RoutePayload = {
  suburb: ResourcePayload<SuburbDetail> | null;
  council: ResourcePayload<CouncilDetail> | null;
  state: ResourcePayload<StateDetail> | null;
  ranking: ResourcePayload<RankingResponse> | null;
  methodology: ResourcePayload<MethodologyResponse> | null;
  exportInfo: ResourcePayload<ExportResponse> | null;
  search: ResourcePayload<SearchResponse> | null;
  compare: ResourcePayload<CompareResponse> | null;
  match: ResourcePayload<MatchResponse> | null;
  explore: ResourcePayload<ExploreResponse> | null;
};

export function emptyRouteData(): RoutePayload {
  return {
    suburb: null,
    council: null,
    state: null,
    ranking: null,
    methodology: null,
    exportInfo: null,
    search: null,
    compare: null,
    match: null,
    explore: null,
  };
}

function readResource<T>(value: unknown): ResourcePayload<T> | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.key !== "string" || typeof record.status !== "string") return null;
  if (record.status === "ready") {
    if (record.data == null || typeof record.data !== "object") return null;
    return { key: record.key, status: "ready", data: record.data as T };
  }
  if (record.status === "error") {
    if (typeof record.statusCode !== "number" || typeof record.detail !== "string") return null;
    return {
      key: record.key,
      status: "error",
      statusCode: record.statusCode,
      detail: record.detail,
    };
  }
  return null;
}

export function readRoutePayload(): RoutePayload {
  const empty = emptyRouteData();
  if (typeof document === "undefined") return empty;
  const node = document.getElementById("route-data");
  if (!node?.textContent) return empty;
  try {
    const parsed: unknown = JSON.parse(node.textContent);
    if (!parsed || typeof parsed !== "object") return empty;
    const record = parsed as Record<string, unknown>;
    return {
      suburb: readResource(record.suburb),
      council: readResource(record.council),
      state: readResource(record.state),
      ranking: readResource(record.ranking),
      methodology: readResource(record.methodology),
      exportInfo: readResource(record.exportInfo),
      search: readResource(record.search),
      compare: readResource(record.compare),
      match: readResource(record.match),
      explore: readResource(record.explore),
    };
  } catch {
    return empty;
  }
}

export function resourceSeed<T>(
  payload: ResourcePayload<T> | null,
  key: string,
): QuerySeed<T> | null {
  if (!payload || payload.key !== key) return null;
  if (payload.status === "ready") return { key, status: "ready", data: payload.data };
  return {
    key,
    status: "error",
    error: new ApiError(payload.statusCode, payload.detail),
  };
}
