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
} from "../api/types";
import { findState } from "../config/geography";
import { findRanking } from "../config/rankings";
import { parsePlaceTokens } from "../lib/places";
import {
  EXPORT_KEY,
  METHODOLOGY_KEY,
  compareKey,
  councilKey,
  exploreKey,
  rankingKey,
  searchKey,
  stateKey,
} from "./keys";
import { loadResource } from "./loadResource";
import { loadSuburb } from "./loadSuburb";
import { emptyRouteData, type RoutePayload } from "./routeData";
import { flatQuery } from "./urls";

export async function loadRouteData(
  url: URL,
  apiBase: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RoutePayload> {
  const data = emptyRouteData();
  const path =
    url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "").toLowerCase() : url.pathname;
  const parts = path.split("/").filter(Boolean);

  if (parts[0] === "suburbs" && parts.length === 3 && parts[1] && parts[2]) {
    data.suburb = await loadSuburb(parts[1], parts[2], apiBase, fetchImpl);
    return data;
  }

  if (parts[0] === "councils" && parts.length === 3 && parts[1] && parts[2]) {
    const key = councilKey(parts[1], parts[2]);
    if (!findState(parts[1])) {
      data.council = {
        key,
        status: "error",
        statusCode: 404,
        detail: "No council is on file for this path.",
      };
      return data;
    }
    data.council = await loadResource<CouncilDetail>(
      key,
      `/api/v1/councils/${parts[1]}/${parts[2]}`,
      apiBase,
      fetchImpl,
      "No council is on file for this path.",
    );
    return data;
  }

  if (parts[0] === "states" && parts.length === 2 && parts[1]) {
    const key = stateKey(parts[1]);
    if (!findState(parts[1])) {
      data.state = {
        key,
        status: "error",
        statusCode: 404,
        detail: "No state is on file for this code.",
      };
      return data;
    }
    data.state = await loadResource<StateDetail>(
      key,
      `/api/v1/states/${parts[1]}`,
      apiBase,
      fetchImpl,
      "No state is on file for this code.",
    );
    return data;
  }

  if (parts[0] === "rankings" && parts.length === 2 && parts[1]) {
    const key = rankingKey(parts[1]);
    if (!findRanking(parts[1])) {
      data.ranking = {
        key,
        status: "error",
        statusCode: 404,
        detail: "No list is published under this name.",
      };
      return data;
    }
    data.ranking = await loadResource<RankingResponse>(
      key,
      `/api/v1/rankings/${parts[1]}`,
      apiBase,
      fetchImpl,
      "No list is published under this name.",
    );
    return data;
  }

  if (path === "/methodology") {
    const [methodology, exportInfo] = await Promise.all([
      loadResource<MethodologyResponse>(METHODOLOGY_KEY, "/api/v1/methodology", apiBase, fetchImpl),
      loadResource<ExportResponse>(EXPORT_KEY, "/api/v1/export", apiBase, fetchImpl),
    ]);
    data.methodology = methodology;
    data.exportInfo = exportInfo;
    return data;
  }

  if (path === "/search") {
    const flat = flatQuery(url.searchParams.get("q"));
    if (!flat) return data;
    const params = new URLSearchParams({ q: flat, limit: "10" });
    data.search = await loadResource<SearchResponse>(
      searchKey(flat),
      `/api/v1/search?${params.toString()}`,
      apiBase,
      fetchImpl,
    );
    return data;
  }

  if (path === "/explore") {
    const metric = url.searchParams.get("metric") ?? "score";
    const stateCode = url.searchParams.get("state") ?? "all";
    const params = new URLSearchParams({ metric });
    if (stateCode !== "all") params.set("state", stateCode);
    data.explore = await loadResource<ExploreResponse>(
      exploreKey(metric, stateCode, []),
      `/api/v1/explore?${params.toString()}`,
      apiBase,
      fetchImpl,
    );
    return data;
  }

  if (path === "/compare") {
    const tokens = parsePlaceTokens(url.searchParams);
    const params = new URLSearchParams();
    for (const token of tokens) params.append("p", token);
    const query = params.toString();
    data.compare = await loadResource<CompareResponse>(
      compareKey(tokens),
      `/api/v1/compare${query ? `?${query}` : ""}`,
      apiBase,
      fetchImpl,
    );
    return data;
  }

  if (path === "/match") {
    const query = url.searchParams.toString();
    data.match = await loadResource<MatchResponse>(
      query,
      `/api/v1/match${query ? `?${query}` : ""}`,
      apiBase,
      fetchImpl,
    );
    return data;
  }

  return data;
}
