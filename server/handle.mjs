import { createReadStream, existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath, pathToFileURL } from "node:url";

import { CONSENT_PATH } from "./consent.mjs";

/**
 * Cache policy for rendered responses.
 *
 * Successful HTML is the same for every visitor. Browsers may reuse it for 60
 * seconds. Shared caches, including the Vercel CDN, keep it fresh for 5 minutes
 * (`s-maxage=300`) and may serve that copy for up to a day while they
 * revalidate (`stale-while-revalidate=86400`). Five minutes is short enough
 * that a catalogue which is empty today can show a real suburb soon after the
 * API has one, without rendering every crawler hit.
 *
 * Sitemap and robots use the same fresh window and a one-hour stale window, so
 * a newly connected suburb list is not stuck in a day-old sitemap.
 *
 * 404 and 5xx are `private, no-store` on Cache-Control, CDN-Cache-Control, and
 * Vercel-CDN-Cache-Control. Vercel will cache a public 404. This catalogue
 * will grow, so an unknown place must not stick, and a 503 from a dead API
 * must not stick either. Vercel also refuses to cache 503s; the headers make
 * that explicit for the Vercel CDN and any cache in front of it.
 *
 * This renderer must not set a cookie and must not vary on Cookie. Consent
 * cookies are set only by `api/consent.js`, which is `private, no-store`.
 * A `Set-Cookie` on a document, or a `Vary: Cookie`, would break the shared
 * cache above.
 */
export const DOCUMENT_CACHE_CONTROL =
  "public, max-age=60, s-maxage=300, stale-while-revalidate=86400";
export const CATALOGUE_CACHE_CONTROL =
  "public, max-age=0, s-maxage=300, stale-while-revalidate=3600";
export const REDIRECT_CACHE_CONTROL = "public, max-age=3600, s-maxage=86400";
export const NO_STORE_CACHE_CONTROL = "private, no-store";

const DOCUMENT_CDN_CACHE = "public, s-maxage=300, stale-while-revalidate=86400";
const CATALOGUE_CDN_CACHE = "public, s-maxage=300, stale-while-revalidate=3600";
const REDIRECT_CDN_CACHE = "public, s-maxage=86400";

const mime = {
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".map": "application/json",
  ".html": "text/html; charset=utf-8",
};

const HOP_BY_HOP = ["connection", "keep-alive", "transfer-encoding", "upgrade", "host"];

export function projectRoot() {
  const candidates = [
    process.cwd(),
    fileURLToPath(new URL("..", import.meta.url)),
    fileURLToPath(new URL("../..", import.meta.url)),
  ];
  for (const candidate of candidates) {
    if (existsSync(join(candidate, "dist-server/entry-server.js"))) return candidate;
  }
  return fileURLToPath(new URL("..", import.meta.url));
}

export function resolveApiBase(env = process.env) {
  return (env.SSR_API_BASE || env.VITE_API_BASE || "http://127.0.0.1:8000").replace(/\/$/, "");
}

export function cacheHeaders(status, pathname) {
  if (status === 301 || status === 308) {
    return {
      "cache-control": REDIRECT_CACHE_CONTROL,
      "cdn-cache-control": REDIRECT_CDN_CACHE,
      "vercel-cdn-cache-control": REDIRECT_CDN_CACHE,
    };
  }
  if (status === 200 && (pathname === "/sitemap.xml" || pathname === "/robots.txt")) {
    return {
      "cache-control": CATALOGUE_CACHE_CONTROL,
      "cdn-cache-control": CATALOGUE_CDN_CACHE,
      "vercel-cdn-cache-control": CATALOGUE_CDN_CACHE,
    };
  }
  if (status === 200) {
    return {
      "cache-control": DOCUMENT_CACHE_CONTROL,
      "cdn-cache-control": DOCUMENT_CDN_CACHE,
      "vercel-cdn-cache-control": DOCUMENT_CDN_CACHE,
    };
  }
  return {
    "cache-control": NO_STORE_CACHE_CONTROL,
    "cdn-cache-control": "no-store",
    "vercel-cdn-cache-control": "no-store",
  };
}

function securityHeaders() {
  return {
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-frame-options": "SAMEORIGIN",
  };
}

export function isProxyPath(pathname) {
  return pathname.startsWith("/api/") || pathname === "/health";
}

function safeJson(value) {
  return JSON.stringify(value ?? null).replace(/</g, "\\u003c");
}

export function applyTemplate(template, rendered, origin) {
  const originScript = `<script>window.__SITE_ORIGIN__=${JSON.stringify(origin)};</script>`;
  const seo = `${rendered.head}\n${originScript}`;
  const routeJson = safeJson(rendered.routeData);
  return template
    .replace(
      /<!--seo-start-->[\s\S]*?<!--seo-end-->/,
      () => `<!--seo-start-->\n${seo}\n<!--seo-end-->`,
    )
    .replace("<!--app-html-->", () => rendered.html)
    .replace(
      /<script type="application\/json" id="route-data">[\s\S]*?<\/script>/,
      () => `<script type="application/json" id="route-data">${routeJson}</script>`,
    );
}

function textResponse(status, body, contentType, pathname) {
  return new Response(body, {
    status,
    headers: {
      "content-type": contentType,
      ...securityHeaders(),
      ...cacheHeaders(status, pathname),
    },
  });
}

function redirectResponse(location) {
  return new Response(null, {
    status: 301,
    headers: {
      location,
      "x-content-type-options": "nosniff",
      ...cacheHeaders(301, ""),
    },
  });
}

async function loadRenderer(options, root) {
  if (options.renderer) {
    return typeof options.renderer === "function" ? options.renderer() : options.renderer;
  }
  if (options.vite) return options.vite.ssrLoadModule("/src/entry-server.tsx");
  return import(pathToFileURL(join(root, "dist-server/entry-server.js")).href);
}

async function readTemplate(root, isProd) {
  const path = isProd ? join(root, "dist-server/template.html") : join(root, "index.html");
  return readFile(path, "utf8");
}

export async function openStatic(pathname, clientDir) {
  if (!pathname || pathname.includes("\0") || pathname.endsWith("/")) return null;
  const relative = pathname.replace(/^\/+/, "");
  if (!relative || relative === "index.html") return null;
  const root = normalize(clientDir);
  const file = normalize(join(root, relative));
  const rootPrefix = root.endsWith(sep) ? root : `${root}${sep}`;
  if (file !== root && !file.startsWith(rootPrefix)) return null;
  try {
    const info = await stat(file);
    if (!info.isFile()) return null;
  } catch {
    return null;
  }
  const type = mime[extname(file)] || "application/octet-stream";
  const cache = relative.startsWith("assets/")
    ? "public, max-age=31536000, immutable"
    : "public, max-age=300";
  return new Response(Readable.toWeb(createReadStream(file)), {
    status: 200,
    headers: {
      "content-type": type,
      "cache-control": cache,
      "x-content-type-options": "nosniff",
    },
  });
}

function stripHopByHop(headers) {
  const next = new Headers(headers);
  for (const name of HOP_BY_HOP) next.delete(name);
  next.delete("content-length");
  next.delete("accept-encoding");
  return next;
}

async function proxyApi(request, apiBase, url) {
  const target = new URL(`${url.pathname}${url.search}`, apiBase);
  const headers = stripHopByHop(request.headers);
  const init = {
    method: request.method,
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(8000),
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }
  try {
    const upstream = await fetch(target, init);
    const out = stripHopByHop(upstream.headers);
    out.delete("content-encoding");
    return new Response(request.method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      headers: out,
    });
  } catch {
    return textResponse(
      502,
      "The record service did not respond.",
      "text/plain; charset=utf-8",
      url.pathname,
    );
  }
}

export async function handleRequest(request, options = {}) {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  const env = options.env ?? process.env;
  const isProd = options.isProd ?? env.NODE_ENV === "production";
  const root = options.root ?? projectRoot();
  const serveStatic = options.serveStatic ?? isProd;

  try {
    // Consent is its own function. If a request still reaches this renderer,
    // do not proxy it to the record API and do not set a cookie.
    if (url.pathname === CONSENT_PATH) {
      return textResponse(
        404,
        JSON.stringify({ detail: "Not found." }),
        "application/json; charset=utf-8",
        url.pathname,
      );
    }
    if (method !== "GET" && method !== "HEAD") {
      if (isProxyPath(url.pathname)) return proxyApi(request, resolveApiBase(env), url);
      return textResponse(405, "Method not allowed.", "text/plain; charset=utf-8", url.pathname);
    }
    if (isProxyPath(url.pathname)) return proxyApi(request, resolveApiBase(env), url);
    if (serveStatic) {
      const file = await openStatic(url.pathname, join(root, "dist"));
      if (file) return file;
    }

    const mod = await loadRenderer(options, root);
    const origin = mod.normaliseOrigin(env.VITE_SITE_ORIGIN || "");
    const apiBase = resolveApiBase(env);
    if (url.pathname === "/sitemap.xml") {
      const paths = await mod.collectPaths(apiBase, options.fetchImpl);
      return textResponse(
        200,
        mod.sitemapXml(origin, paths),
        "application/xml; charset=utf-8",
        url.pathname,
      );
    }
    if (url.pathname === "/robots.txt") {
      return textResponse(200, mod.robotsTxt(origin), "text/plain; charset=utf-8", url.pathname);
    }

    const location = mod.canonicalRedirect(url.pathname, url.search);
    if (location) return redirectResponse(location);

    const rendered = await mod.render(`${url.pathname}${url.search}`, {
      origin,
      apiBase,
      fetchImpl: options.fetchImpl,
    });
    let template = options.template;
    if (template == null) template = await readTemplate(root, isProd);
    if (!isProd && options.vite) {
      template = await options.vite.transformIndexHtml(`${url.pathname}${url.search}`, template);
    }
    const html = applyTemplate(template, rendered, origin);
    const status = rendered.status || 200;
    const headers = {
      "content-type": "text/html; charset=utf-8",
      ...securityHeaders(),
      ...cacheHeaders(status, url.pathname),
    };
    if (rendered.robots) headers["x-robots-tag"] = rendered.robots;
    return new Response(html, { status, headers });
  } catch (error) {
    if (options.vite) options.vite.ssrFixStacktrace(error);
    console.error(error);
    return textResponse(
      500,
      "<p>The page did not render.</p>",
      "text/html; charset=utf-8",
      url.pathname,
    );
  }
}

export function nodeRequestToWeb(req) {
  const host = req.headers.host || "localhost";
  const url = new URL(req.url || "/", `http://${host}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else headers.set(key, value);
  }
  const init = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = Readable.toWeb(req);
    init.duplex = "half";
  }
  return new Request(url, init);
}

export function nodeHeadersFromResponse(response) {
  const headers = {};
  const cookies =
    typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  for (const [key, value] of response.headers) {
    if (key.toLowerCase() === "set-cookie") continue;
    const current = headers[key];
    if (current === undefined) headers[key] = value;
    else if (Array.isArray(current)) current.push(value);
    else headers[key] = [current, value];
  }
  if (cookies.length === 1) headers["set-cookie"] = cookies[0];
  else if (cookies.length > 1) headers["set-cookie"] = cookies;
  return headers;
}

export async function writeNodeResponse(res, response) {
  const headers = nodeHeadersFromResponse(response);
  res.writeHead(response.status, headers);
  if (!response.body) {
    res.end();
    return;
  }
  await new Promise((resolve, reject) => {
    const stream = Readable.fromWeb(response.body);
    stream.on("error", reject);
    res.on("error", reject);
    res.on("finish", resolve);
    stream.pipe(res);
  });
}

export async function handleNodeRequest(req, res, options) {
  const response = await handleRequest(nodeRequestToWeb(req), options);
  await writeNodeResponse(res, response);
}
