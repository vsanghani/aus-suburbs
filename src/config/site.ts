/** The only display name in the interface. Rename the product here. */
export const site = {
  name: "Kerbfox",
  description: "A public record of Australian suburbs, read from government datasets.",
} as const;

declare global {
  interface Window {
    __SITE_ORIGIN__?: string;
  }
}

/**
 * Public origin for canonical links, Open Graph URLs, JSON-LD, and the sitemap.
 * No trailing slash, no path. Empty until `VITE_SITE_ORIGIN` is a bare http(s) origin.
 * The Node server reads that same variable and copies the normalised value onto `window.__SITE_ORIGIN__`.
 */
export function normaliseOrigin(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    if (url.username || url.password || url.search || url.hash) return "";
    if (url.pathname !== "/" && url.pathname !== "") return "";
    return url.origin;
  } catch {
    return "";
  }
}

export function siteOrigin(): string {
  const injected =
    typeof globalThis !== "undefined"
      ? (globalThis as { __SITE_ORIGIN__?: unknown }).__SITE_ORIGIN__
      : undefined;
  let fromProcess = "";
  if (typeof process !== "undefined" && process.env?.VITE_SITE_ORIGIN) {
    fromProcess = process.env.VITE_SITE_ORIGIN;
  }
  const fromVite = import.meta.env.VITE_SITE_ORIGIN ?? "";
  const raw = (typeof injected === "string" && injected) || fromProcess || fromVite;
  return normaliseOrigin(raw);
}

/** One absolute URL. Paths lose a trailing slash; the root stays `/`. */
export function absoluteUrl(path: string, origin = siteOrigin()): string | null {
  const clean = normaliseOrigin(origin);
  if (!clean) return null;
  const [pathname = "/", query = ""] = path.split("?");
  let normalised = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (normalised.length > 1) normalised = normalised.replace(/\/+$/, "") || "/";
  const suffix = query ? `?${query}` : "";
  return `${clean}${normalised}${suffix}`;
}
