import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer, request as httpRequest } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || (isProd ? 4173 : 5173));
const origin = (process.env.VITE_SITE_ORIGIN || "").trim().replace(/\/$/, "");
const apiBase = (
  process.env.SSR_API_BASE ||
  process.env.VITE_API_BASE ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");
const clientDir = join(root, "dist");

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

let vite = null;
if (!isProd) {
  const { createServer: createViteServer } = await import("vite");
  vite = await createViteServer({
    root,
    server: { middlewareMode: true },
    appType: "custom",
  });
}

function safeJson(value) {
  return JSON.stringify(value ?? null).replace(/</g, "\\u003c");
}

function applyTemplate(template, rendered) {
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

async function renderer() {
  if (vite) return vite.ssrLoadModule("/src/entry-server.tsx");
  return import(new URL("../dist/server/entry-server.js", import.meta.url));
}

function proxyApi(req, res) {
  const target = new URL(req.url || "/", apiBase);
  const headers = { ...req.headers, host: target.host };
  delete headers["accept-encoding"];
  const upstream = httpRequest(target, { method: req.method, headers }, (up) => {
    const responseHeaders = { ...up.headers };
    delete responseHeaders["content-length"];
    res.writeHead(up.statusCode || 502, responseHeaders);
    up.pipe(res);
  });
  upstream.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    }
    res.end("The record service did not respond.");
  });
  if (req.method === "GET" || req.method === "HEAD") upstream.end();
  else req.pipe(upstream);
}

async function serveStatic(pathname, res) {
  if (!pathname || pathname.includes("\0") || pathname.endsWith("/")) return false;
  const relative = pathname.replace(/^\/+/, "");
  if (!relative || relative === "index.html") return false;
  const file = normalize(join(clientDir, relative));
  if (!file.startsWith(normalize(clientDir))) return false;
  try {
    const info = await stat(file);
    if (!info.isFile()) return false;
  } catch {
    return false;
  }
  const type = mime[extname(file)] || "application/octet-stream";
  res.writeHead(200, {
    "content-type": type,
    "cache-control": relative.startsWith("assets/")
      ? "public, max-age=31536000, immutable"
      : "public, max-age=300",
    "x-content-type-options": "nosniff",
  });
  createReadStream(file).pipe(res);
  return true;
}

function sendText(res, status, type, body) {
  res.writeHead(status, {
    "content-type": type,
    "cache-control": "public, max-age=0, must-revalidate",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-frame-options": "SAMEORIGIN",
  });
  res.end(body);
}

async function sendDocument(req, res, url) {
  const mod = await renderer();
  const rendered = await mod.render(`${url.pathname}${url.search}`, { origin, apiBase });
  const templatePath = isProd ? join(clientDir, "index.html") : join(root, "index.html");
  let template = await readFile(templatePath, "utf8");
  if (vite) template = await vite.transformIndexHtml(url.pathname + url.search, template);
  const html = applyTemplate(template, rendered);
  sendText(res, rendered.status || 200, "text/html; charset=utf-8", html);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (url.pathname.startsWith("/api/") || url.pathname === "/health") {
        proxyApi(req, res);
        return;
      }
      sendText(res, 405, "text/plain; charset=utf-8", "Method not allowed.");
      return;
    }
    if (url.pathname.startsWith("/api/") || url.pathname === "/health") {
      proxyApi(req, res);
      return;
    }
    if (url.pathname === "/sitemap.xml") {
      const mod = await renderer();
      const paths = await mod.collectPaths(apiBase);
      sendText(res, 200, "application/xml; charset=utf-8", mod.sitemapXml(origin, paths));
      return;
    }
    if (url.pathname === "/robots.txt") {
      const mod = await renderer();
      sendText(res, 200, "text/plain; charset=utf-8", mod.robotsTxt(origin));
      return;
    }
    if (!isProd && vite) {
      await new Promise((resolve, reject) => {
        vite.middlewares(req, res, (error) => (error ? reject(error) : resolve()));
      });
      if (res.writableEnded) return;
    } else if (await serveStatic(url.pathname, res)) {
      return;
    }
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      res.writeHead(301, { location: url.pathname.replace(/\/+$/, "") + url.search });
      res.end();
      return;
    }
    await sendDocument(req, res, url);
  } catch (error) {
    if (vite) vite.ssrFixStacktrace(error);
    console.error(error);
    if (!res.headersSent) {
      sendText(res, 500, "text/html; charset=utf-8", "<p>The page did not render.</p>");
    } else {
      res.end();
    }
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Listening on http://127.0.0.1:${port}`);
});
