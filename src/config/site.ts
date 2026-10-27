/** The only display name in the interface. Rename the product here. */
export const site = {
  name: "Hearthfire",
  description: "A public record of Australian suburbs, read from government datasets.",
} as const;

declare global {
  interface Window {
    __SITE_ORIGIN__?: string;
  }
}

/**
 * Public origin for canonical links, Open Graph URLs, and the sitemap.
 * No trailing slash. Empty until `VITE_SITE_ORIGIN` is set.
 * The Node server reads that same variable and copies it onto `window.__SITE_ORIGIN__`.
 */
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
  return raw.trim().replace(/\/$/, "");
}

export function absoluteUrl(path: string, origin = siteOrigin()): string | null {
  if (!origin) return null;
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalised}`;
}
