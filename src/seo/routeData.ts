import { ApiError } from "../api/client";
import type { SuburbDetail } from "../api/types";
import type { QuerySeed } from "../api/useApi";

export type SuburbPayload =
  | { key: string; status: "ready"; data: SuburbDetail }
  | { key: string; status: "error"; statusCode: number; detail: string };

export type RoutePayload = {
  suburb: SuburbPayload | null;
};

export function emptyRouteData(): RoutePayload {
  return { suburb: null };
}

export function readRoutePayload(): RoutePayload {
  if (typeof document === "undefined") return emptyRouteData();
  const node = document.getElementById("route-data");
  if (!node?.textContent) return emptyRouteData();
  try {
    const parsed: unknown = JSON.parse(node.textContent);
    if (!parsed || typeof parsed !== "object") return emptyRouteData();
    const suburb = (parsed as { suburb?: unknown }).suburb;
    if (suburb == null) return emptyRouteData();
    if (!isSuburbPayload(suburb)) return emptyRouteData();
    return { suburb };
  } catch {
    return emptyRouteData();
  }
}

function isSuburbPayload(value: unknown): value is SuburbPayload {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (typeof record.key !== "string" || typeof record.status !== "string") return false;
  if (record.status === "ready") return record.data != null && typeof record.data === "object";
  if (record.status === "error") {
    return typeof record.statusCode === "number" && typeof record.detail === "string";
  }
  return false;
}

export function suburbSeed(
  payload: SuburbPayload | null,
  key: string,
): QuerySeed<SuburbDetail> | null {
  if (!payload || payload.key !== key) return null;
  if (payload.status === "ready") return { key, status: "ready", data: payload.data };
  return {
    key,
    status: "error",
    error: new ApiError(payload.statusCode, payload.detail),
  };
}
