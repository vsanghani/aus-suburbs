import { site, absoluteUrl } from "../config/site";

export type HeadInput = {
  title: string;
  description: string;
  path: string;
  robots?: string;
  jsonLd?: Record<string, unknown> | null;
  status?: number;
};

const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 160;

export function pageTitle(title: string): string {
  const trimmed = title.replace(/\s+/g, " ").trim();
  if (!trimmed || trimmed === site.name) return site.name;
  const suffix = ` · ${site.name}`;
  if (trimmed.length + suffix.length <= TITLE_LIMIT) return `${trimmed}${suffix}`;
  const room = Math.max(12, TITLE_LIMIT - suffix.length - 1);
  const cut = trimmed.slice(0, room);
  const word = cut.lastIndexOf(" ");
  const head = (word > 16 ? cut.slice(0, word) : cut).trimEnd();
  return `${head}…${suffix}`;
}

export function clipText(value: string, max = DESCRIPTION_LIMIT): string {
  const flat = value.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const word = cut.lastIndexOf(" ");
  const head = (word > 80 ? cut.slice(0, word) : cut).trimEnd();
  return `${head}…`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderHead(input: HeadInput, origin: string): string {
  const title = escapeHtml(pageTitle(input.title));
  const description = escapeHtml(clipText(input.description));
  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" data-seo="1" />`,
  ];
  const canonical = absoluteUrl(input.path, origin);
  if (canonical) {
    const href = escapeHtml(canonical);
    tags.push(`<link rel="canonical" href="${href}" data-seo="1" />`);
  }
  const ogUrl = canonical ? escapeHtml(canonical) : "";
  tags.push(
    `<meta property="og:title" content="${title}" data-seo="1" />`,
    `<meta property="og:description" content="${description}" data-seo="1" />`,
    `<meta property="og:type" content="website" data-seo="1" />`,
    `<meta property="og:site_name" content="${escapeHtml(site.name)}" data-seo="1" />`,
    `<meta property="og:locale" content="en_AU" data-seo="1" />`,
    `<meta name="twitter:card" content="summary" data-seo="1" />`,
    `<meta name="twitter:title" content="${title}" data-seo="1" />`,
    `<meta name="twitter:description" content="${description}" data-seo="1" />`,
  );
  if (ogUrl) {
    tags.push(
      `<meta property="og:url" content="${ogUrl}" data-seo="1" />`,
      `<meta name="twitter:url" content="${ogUrl}" data-seo="1" />`,
    );
  }
  if (input.robots) {
    tags.push(`<meta name="robots" content="${escapeHtml(input.robots)}" data-seo="1" />`);
  }
  if (input.jsonLd) {
    const json = JSON.stringify(input.jsonLd).replace(/</g, "\\u003c");
    tags.push(`<script type="application/ld+json" data-seo="1">${json}</script>`);
  }
  return tags.join("\n");
}

function upsertMeta(attr: "name" | "property", key: string, content: string | null): void {
  const selector = `meta[${attr}="${CSS.escape(key)}"]`;
  const nodes = Array.from(document.head.querySelectorAll(selector));
  if (!content) {
    for (const node of nodes) {
      if (node.hasAttribute("data-seo")) node.remove();
    }
    return;
  }
  let node = nodes.find((item) => item.hasAttribute("data-seo")) ?? nodes[0] ?? null;
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attr, key);
    document.head.append(node);
  }
  node.setAttribute("data-seo", "1");
  node.setAttribute("content", content);
  for (const extra of nodes) {
    if (extra !== node) extra.remove();
  }
}

function upsertLink(rel: string, href: string | null): void {
  const nodes = Array.from(
    document.head.querySelectorAll<HTMLLinkElement>(`link[rel="${CSS.escape(rel)}"]`),
  );
  if (!href) {
    for (const node of nodes) {
      if (node.hasAttribute("data-seo")) node.remove();
    }
    return;
  }
  let node = nodes.find((item) => item.hasAttribute("data-seo")) ?? nodes[0] ?? null;
  if (!node) {
    node = document.createElement("link");
    node.rel = rel;
    document.head.append(node);
  }
  node.setAttribute("data-seo", "1");
  node.href = href;
  for (const extra of nodes) {
    if (extra !== node) extra.remove();
  }
}

function upsertJsonLd(jsonLd: Record<string, unknown> | null): void {
  const selector = 'script[type="application/ld+json"][data-seo]';
  const existing = document.head.querySelector(selector);
  if (!jsonLd) {
    existing?.remove();
    return;
  }
  const node = existing ?? document.createElement("script");
  node.setAttribute("type", "application/ld+json");
  node.setAttribute("data-seo", "1");
  node.textContent = JSON.stringify(jsonLd);
  if (!existing) document.head.append(node);
}

/** Updates the document head after a client navigation. */
export function applyHead(input: HeadInput, origin: string): void {
  const title = pageTitle(input.title);
  const description = clipText(input.description);
  document.title = title;
  upsertMeta("name", "description", description);
  const canonical = absoluteUrl(input.path, origin);
  upsertLink("canonical", canonical);
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:url", canonical);
  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:site_name", site.name);
  upsertMeta("property", "og:locale", "en_AU");
  upsertMeta("name", "twitter:card", "summary");
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", description);
  upsertMeta("name", "twitter:url", canonical);
  upsertMeta("name", "robots", input.robots ?? null);
  upsertJsonLd(input.jsonLd ?? null);
}
