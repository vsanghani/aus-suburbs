import type { SuburbDetail } from "../api/types";
import { suburbKey } from "./keys";
import { loadResource } from "./loadResource";
import type { SuburbPayload } from "./routeData";

export async function loadSuburb(
  state: string,
  slug: string,
  apiBase: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SuburbPayload> {
  return loadResource<SuburbDetail>(
    suburbKey(state, slug),
    `/api/v1/suburbs/${state}/${slug}`,
    apiBase,
    fetchImpl,
    "No suburb is on file for this path.",
  );
}
