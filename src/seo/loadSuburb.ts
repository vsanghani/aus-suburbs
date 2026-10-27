import type { SuburbDetail } from "../api/types";
import type { SuburbPayload } from "./routeData";

export async function loadSuburb(
  state: string,
  slug: string,
  apiBase: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SuburbPayload> {
  const key = `${state}:${slug}`;
  const root = apiBase.replace(/\/$/, "");
  try {
    const response = await fetchImpl(`${root}/api/v1/suburbs/${state}/${slug}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(1200),
    });
    if (response.status === 404) {
      let detail = "No suburb is on file for this path.";
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
    const data = (await response.json()) as SuburbDetail;
    return { key, status: "ready", data };
  } catch {
    return {
      key,
      status: "error",
      statusCode: 0,
      detail: "The record service did not respond.",
    };
  }
}
