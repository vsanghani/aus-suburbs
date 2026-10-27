import type { SuburbDetail } from "../api/types";
import { findState } from "../config/geography";
import { humaniseSlug } from "../lib/format";
import { splitToken } from "../lib/places";
import { clipText } from "./meta";
import { compareCanonicalPath, flatQuery, searchCanonicalPath } from "./urls";

export function homeCopy(): { title: string; description: string; path: string } {
  return {
    title: "Australian suburbs",
    description:
      "A public record of Australian suburbs for housing, property, schools, transport, safety, and hazards, read from government datasets.",
    path: "/",
  };
}

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
  else if (notOnFile) {
    description = `No suburb record is on file for ${name} in ${stateName}.`;
  } else {
    description = `${name}, ${stateName}. Suburb record for housing, property, schools, transport, safety, and hazards, when a dataset is connected.`;
  }
  return { title, description, path };
}

export function stateCopy(
  code: string,
  name: string,
  missing: boolean,
): { title: string; description: string; path: string } {
  return {
    title: missing ? "State not found" : `Suburbs in ${name}`,
    description: missing
      ? `No state is on file for ${code || "this code"}.`
      : `Suburbs, councils, and regions in ${name}, Australia. Housing and property figures appear when a dataset is connected.`,
    path: `/states/${code.toLowerCase()}`,
  };
}

export function councilCopy(
  state: string,
  slug: string,
  heading: string,
  stateName: string | undefined,
  notOnFile: boolean,
): { title: string; description: string; path: string } {
  return {
    title: `${heading} council${stateName ? `, ${stateName}` : ""}`,
    description: notOnFile
      ? `No council record is on file for ${heading}${stateName ? ` in ${stateName}` : ""}.`
      : `${heading} is a council${stateName ? ` in ${stateName}, Australia` : ""}. Suburb, housing, and property figures appear when a dataset is connected.`,
    path: `/councils/${state.toLowerCase()}/${slug.toLowerCase()}`,
  };
}

export function rankingCopy(
  slug: string,
  heading: string,
  question: string | undefined,
  missing: boolean,
): { title: string; description: string; path: string } {
  return {
    title: missing ? "List not found" : `${heading} by suburb`,
    description: missing
      ? "This name is not a published list of Australian suburbs."
      : question
        ? `${question} Ranked Australian suburbs, from public data when a dataset is connected.`
        : `${heading} for Australian suburbs, from public data when a dataset is connected.`,
    path: `/rankings/${slug.toLowerCase()}`,
  };
}

export function rankingsIndexCopy(): { title: string; description: string; path: string } {
  return {
    title: "Suburb rankings",
    description:
      "Fixed lists of Australian suburbs for rent, prices, schools, transport, safety, and the draft composite.",
    path: "/rankings",
  };
}

export function searchCopy(query: string): { title: string; description: string; path: string } {
  const flat = flatQuery(query);
  const shown = flat.length > 40 ? `${flat.slice(0, 39).trimEnd()}…` : flat;
  return {
    title: flat ? `${shown} suburb search` : "Search Australian suburbs",
    description: flat
      ? `Search results for ${shown} across Australian suburbs, councils, and postcodes. Housing and property records appear when a dataset is connected.`
      : "Search Australian suburbs, councils, and postcodes. Housing and property records appear when a dataset is connected.",
    path: searchCanonicalPath(flat),
  };
}

export function exploreCopy(): { title: string; description: string; path: string } {
  return {
    title: "Explore the suburb map",
    description:
      "Map of Australian suburbs with boundaries and overlays for housing, hazards, schools, and transport. Geometries appear when a dataset is connected.",
    path: "/explore",
  };
}

export function compareCopy(tokens: readonly string[]): {
  title: string;
  description: string;
  path: string;
} {
  const names = tokens.map((token) => humaniseSlug(splitToken(token).slug));
  let title = "Compare suburbs";
  if (names.length === 1) title = `Compare ${names[0]}`;
  else if (names.length === 2) title = `Compare ${names[0]} and ${names[1]}`;
  else if (names.length > 2) {
    title = `Compare ${names[0]}, ${names[1]} and ${names.length - 2} more`;
  }
  const description =
    names.length > 0
      ? `Compare ${names.join(", ")} on the same housing, property, and suburb rows. Nothing is blended into a winner.`
      : "Compare up to four Australian suburbs on housing, property, schools, transport, and safety. Nothing is blended into a winner.";
  return { title, description, path: compareCanonicalPath(tokens) };
}

export function matchCopy(): { title: string; description: string; path: string } {
  return {
    title: "Match suburbs",
    description:
      "Re-rank Australian suburbs with your own weights for housing, commute, schools, and safety. The list stays empty until scores are loaded.",
    path: "/match",
  };
}

export function methodologyCopy(): { title: string; description: string; path: string } {
  return {
    title: "Suburb score methodology",
    description:
      "How the draft suburb score is calculated from public data. Missing inputs are skipped, not treated as zero. It is not property advice.",
    path: "/methodology",
  };
}

export function privacyCopy(): { title: string; description: string; path: string } {
  return {
    title: "Privacy",
    description:
      "No accounts. The theme and kept suburbs stay in this browser. Search text and compare choices are sent only to answer a request.",
    path: "/privacy",
  };
}

export function shortlistCopy(): { title: string; description: string; path: string } {
  return {
    title: "Kept suburbs",
    description: "Suburbs kept in this browser. They are not an account, and they are not synced.",
    path: "/shortlist",
  };
}

export function notFoundCopy(pathname: string): {
  title: string;
  description: string;
  path: string;
} {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return {
    title: "Page not found",
    description: "This address is not part of the Australian suburb record.",
    path: path.split("?")[0] || "/",
  };
}
