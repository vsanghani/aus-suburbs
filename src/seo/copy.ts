import type { SuburbDetail } from "../api/types";
import { findState } from "../config/geography";
import { humaniseSlug } from "../lib/format";
import { clipText } from "./meta";

export function suburbCopy(
  state: string,
  slug: string,
  place: SuburbDetail | null,
  notOnFile: boolean,
): { title: string; description: string; path: string } {
  const stateName = findState(state)?.name ?? state.toUpperCase();
  const name = place?.name ?? humaniseSlug(slug);
  const path = `/suburbs/${state}/${slug}`;
  const title = `${name}, ${stateName}`;
  const written = place?.description?.trim() || place?.blurb?.trim();
  let description: string;
  if (written) description = clipText(written);
  else if (notOnFile) description = `No record is on file for ${name} in ${stateName}.`;
  else {
    description = `${name}, ${stateName}. Housing, schools, transport, safety, and hazards, when a dataset is connected.`;
  }
  return { title, description, path };
}
