import type { CouncilListResponse, SuburbListResponse } from "../api/types";
import { absoluteUrl } from "../config/site";
import { STATES } from "../config/geography";
import { RANKINGS } from "../config/rankings";

/** Routes the interface actually ships. Suburb and council URLs are not in this list. */
export function staticPaths(): string[] {
  return [
    "/",
    "/explore",
    "/search",
    "/rankings",
    "/compare",
    "/match",
    "/methodology",
    "/privacy",
    ...STATES.map((state) => `/states/${state.code}`),
    ...RANKINGS.map((ranking) => `/rankings/${ranking.slug}`),
  ];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function sitemapXml(origin: string, paths: string[]): string {
  const urls = paths
    .map((path) => {
      const loc = absoluteUrl(path, origin);
      if (!loc) return "";
      return `  <url><loc>${escapeXml(loc)}</loc></url>`;
    })
    .filter(Boolean)
    .join("\n");
  const body = urls ? `\n${urls}\n` : "\n";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>\n`;
}

export function robotsTxt(origin: string): string {
  const lines = ["User-agent: *", "Allow: /", "Disallow: /shortlist"];
  const sitemap = absoluteUrl("/sitemap.xml", origin);
  if (sitemap) lines.push("", `Sitemap: ${sitemap}`);
  return `${lines.join("\n")}\n`;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/** Suburb paths from GET /api/v1/suburbs. An empty or disconnected catalogue adds nothing. */
export async function suburbPaths(
  apiBase: string,
  fetchImpl: typeof fetch = fetch,
  pageSize = 100,
): Promise<string[]> {
  const found: string[] = [];
  const root = apiBase.replace(/\/$/, "");
  const limit = pageSize;
  let offset = 0;
  for (let page = 0; page < 1000; page += 1) {
    let response: Response;
    try {
      response = await fetchImpl(`${root}/api/v1/suburbs?limit=${limit}&offset=${offset}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(1500),
      });
    } catch {
      return found;
    }
    if (!response.ok) return found;
    const body = (await readJson(response)) as SuburbListResponse | null;
    if (!body?.dataset_connected || !Array.isArray(body.suburbs) || body.suburbs.length === 0) {
      return found;
    }
    for (const suburb of body.suburbs) {
      if (!suburb?.state || !suburb.slug) continue;
      found.push(`/suburbs/${suburb.state.toLowerCase()}/${suburb.slug.toLowerCase()}`);
    }
    offset += body.suburbs.length;
    if (body.suburbs.length < limit) return found;
    if (body.total != null && offset >= body.total) return found;
  }
  return found;
}

/** Council paths from GET /api/v1/councils, only when that list is actually connected. */
export async function councilPaths(
  apiBase: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string[]> {
  const root = apiBase.replace(/\/$/, "");
  try {
    const response = await fetchImpl(`${root}/api/v1/councils`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) return [];
    const body = (await readJson(response)) as CouncilListResponse | null;
    if (!body?.dataset_connected || !Array.isArray(body.councils) || body.councils.length === 0) {
      return [];
    }
    return body.councils
      .filter((council) => council.state && council.slug)
      .map((council) => `/councils/${council.state.toLowerCase()}/${council.slug.toLowerCase()}`);
  } catch {
    return [];
  }
}

export async function collectPaths(
  apiBase: string,
  fetchImpl: typeof fetch = fetch,
  pageSize = 100,
): Promise<string[]> {
  const [suburbs, councils] = await Promise.all([
    suburbPaths(apiBase, fetchImpl, pageSize),
    councilPaths(apiBase, fetchImpl),
  ]);
  return [...new Set([...staticPaths(), ...suburbs, ...councils])];
}
