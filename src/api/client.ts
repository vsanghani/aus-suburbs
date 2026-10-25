import type {
  CommuteResponse,
  CompareResponse,
  CouncilDetail,
  ExploreResponse,
  ExportResponse,
  MatchResponse,
  MethodologyResponse,
  RankingListResponse,
  RankingResponse,
  SearchResponse,
  StateDetail,
  SuburbDetail,
} from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function apiBase(): string {
  return import.meta.env.VITE_API_BASE?.replace(/\/$/, "") ?? "";
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBase()}${path}`, {
      signal,
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "The record service did not respond.");
  }
  if (!response.ok) {
    let detail = `The record service returned ${response.status}.`;
    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      // A non-JSON error keeps the status sentence.
    }
    throw new ApiError(response.status, detail);
  }
  return (await response.json()) as T;
}

export function fetchSearch(
  q: string,
  signal?: AbortSignal,
  state?: string,
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q, limit: "10" });
  if (state) params.set("state", state);
  return request(`/api/v1/search?${params.toString()}`, signal);
}

export function fetchSuburb(
  state: string,
  slug: string,
  signal?: AbortSignal,
): Promise<SuburbDetail> {
  return request(`/api/v1/suburbs/${state}/${slug}`, signal);
}

export function fetchCouncil(
  state: string,
  slug: string,
  signal?: AbortSignal,
): Promise<CouncilDetail> {
  return request(`/api/v1/councils/${state}/${slug}`, signal);
}

export function fetchState(code: string, signal?: AbortSignal): Promise<StateDetail> {
  return request(`/api/v1/states/${code}`, signal);
}

export function fetchRankings(signal?: AbortSignal): Promise<RankingListResponse> {
  return request("/api/v1/rankings", signal);
}

export function fetchRanking(
  slug: string,
  filters: { state?: string; region?: string; council?: string },
  signal?: AbortSignal,
): Promise<RankingResponse> {
  const params = new URLSearchParams();
  if (filters.state) params.set("state", filters.state);
  if (filters.region) params.set("region", filters.region);
  if (filters.council) params.set("council", filters.council);
  const query = params.toString();
  return request(`/api/v1/rankings/${slug}${query ? `?${query}` : ""}`, signal);
}

export function fetchCompare(tokens: string[], signal?: AbortSignal): Promise<CompareResponse> {
  const params = new URLSearchParams();
  for (const token of tokens) params.append("p", token);
  const query = params.toString();
  return request(`/api/v1/compare${query ? `?${query}` : ""}`, signal);
}

export function fetchMatch(params: URLSearchParams, signal?: AbortSignal): Promise<MatchResponse> {
  const query = params.toString();
  return request(`/api/v1/match${query ? `?${query}` : ""}`, signal);
}

export function fetchExplore(
  input: { metric: string; state?: string; layers: string[] },
  signal?: AbortSignal,
): Promise<ExploreResponse> {
  const params = new URLSearchParams({ metric: input.metric });
  if (input.state) params.set("state", input.state);
  if (input.layers.length > 0) params.set("layers", input.layers.join(","));
  return request(`/api/v1/explore?${params.toString()}`, signal);
}

export function fetchMethodology(signal?: AbortSignal): Promise<MethodologyResponse> {
  return request("/api/v1/methodology", signal);
}

export function fetchCommute(
  state: string,
  slug: string,
  destination: string,
  signal?: AbortSignal,
): Promise<CommuteResponse> {
  const params = new URLSearchParams({ state, slug, to: destination });
  return request(`/api/v1/commute?${params.toString()}`, signal);
}

export function fetchExport(signal?: AbortSignal): Promise<ExportResponse> {
  return request("/api/v1/export", signal);
}
