import type { ResourcePayload } from "./routeData";

export async function loadResource<T>(
  key: string,
  path: string,
  apiBase: string,
  fetchImpl: typeof fetch = fetch,
  notFoundDetail = "No record is on file for this path.",
): Promise<ResourcePayload<T>> {
  const root = apiBase.replace(/\/$/, "");
  try {
    const response = await fetchImpl(`${root}${path}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(1200),
    });
    if (response.status === 404) {
      let detail = notFoundDetail;
      try {
        const body = (await response.json()) as { detail?: unknown };
        if (typeof body.detail === "string" && body.detail.trim()) detail = body.detail;
      } catch {
        // A non-JSON 404 keeps the fallback sentence.
      }
      return { key, status: "error", statusCode: 404, detail };
    }
    if (!response.ok) {
      return {
        key,
        status: "error",
        statusCode: response.status,
        detail: `The record service returned ${response.status}.`,
      };
    }
    const data: unknown = await response.json();
    if (!data || typeof data !== "object") {
      return {
        key,
        status: "error",
        statusCode: response.status,
        detail: "The record service returned an unreadable record.",
      };
    }
    return { key, status: "ready", data: data as T };
  } catch {
    return {
      key,
      status: "error",
      statusCode: 0,
      detail: "The record service did not respond.",
    };
  }
}
