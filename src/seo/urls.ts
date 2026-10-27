import { parsePlaceTokens } from "../lib/places";

const FIXED = new Set([
  "/",
  "/explore",
  "/search",
  "/rankings",
  "/compare",
  "/match",
  "/methodology",
  "/privacy",
  "/shortlist",
]);

export function flatQuery(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function searchCanonicalPath(query: string): string {
  const flat = flatQuery(query);
  if (!flat) return "/search";
  const params = new URLSearchParams();
  params.set("q", flat);
  return `/search?${params.toString()}`;
}

export function compareCanonicalPath(tokens: readonly string[]): string {
  if (tokens.length === 0) return "/compare";
  const params = new URLSearchParams();
  for (const token of tokens) params.append("p", token);
  return `/compare?${params.toString()}`;
}

function loweredPlace(path: string): string | null {
  const parts = path.split("/");
  if (parts.length < 3 || parts.slice(1).some((part) => part === "")) return null;
  const root = parts[1]?.toLowerCase();
  if (root === "states" && parts.length === 3) return `/states/${parts[2]!.toLowerCase()}`;
  if (root === "rankings" && parts.length === 3) return `/rankings/${parts[2]!.toLowerCase()}`;
  if ((root === "suburbs" || root === "councils") && parts.length === 4) {
    return `/${root}/${parts[2]!.toLowerCase()}/${parts[3]!.toLowerCase()}`;
  }
  return null;
}

function canonicalQuery(path: string, rawQuery: string): string {
  if (path === "/search") {
    const flat = flatQuery(new URLSearchParams(rawQuery).get("q"));
    if (!flat) return "";
    return searchCanonicalPath(flat).slice("/search".length);
  }
  if (path === "/compare") {
    const tokens = parsePlaceTokens(new URLSearchParams(rawQuery));
    if (tokens.length === 0) return "";
    return compareCanonicalPath(tokens).slice("/compare".length);
  }
  return rawQuery ? `?${rawQuery}` : "";
}

/**
 * Permanent redirect for trailing slashes, letter case, `/index.html`, `/sources`,
 * and the normalised search and compare queries. Null when the request is already canonical.
 * The hash on `/sources` is the sources section of the methodology page.
 */
export function canonicalRedirect(pathname: string, search = ""): string | null {
  if (!pathname.startsWith("/") || pathname.includes("\0") || pathname.includes("\\")) return null;
  const rawQuery = search.startsWith("?") ? search.slice(1) : search;
  let path = pathname;
  if (path.length > 1) path = path.replace(/\/+$/, "") || "/";
  if (path.toLowerCase() === "/index.html") path = "/";
  const lower = path.toLowerCase();
  if (lower === "/sources") return "/methodology#sources";

  const place = loweredPlace(path);
  const target = place ?? (FIXED.has(lower) ? lower : path);
  const nextQuery = canonicalQuery(target, rawQuery);
  const currentQuery = search ? (search.startsWith("?") ? search : `?${search}`) : "";
  const next = `${target}${nextQuery}`;
  const current = `${pathname}${currentQuery}`;
  if (next === current) return null;
  return next;
}
