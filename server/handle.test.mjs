// @vitest-environment node
import { createServer } from "node:http";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { describe, expect, it } from "vitest";
import { createFetchHandler } from "../api/ssr.js";
import * as renderer from "../src/entry-server.tsx";
import {
  DOCUMENT_CACHE_CONTROL,
  NO_STORE_CACHE_CONTROL,
  handleRequest,
  openStatic,
} from "./handle.mjs";

const origin = "https://example.test";
const template = await readFile(new URL("../index.html", import.meta.url), "utf8");

const suburb = {
  state: "vic",
  slug: "richmond",
  name: "Richmond",
  postcode: "3121",
  council_name: "Yarra",
  council_slug: "yarra",
  region_name: null,
  region_slug: null,
  traditional_owners: "Wurundjeri",
  population: 28000,
  latitude: -37.82,
  longitude: 144.99,
  score: 62,
  tier: "Steady",
  blurb: "Inner suburb.",
  description: null,
  description_source: null,
  score_detail: null,
  sections: {},
  nearby: [],
  ranks: [],
  geometry: null,
};

function handler(fetchImpl, env = {}) {
  return createFetchHandler({
    renderer,
    template,
    fetchImpl,
    env: { VITE_SITE_ORIGIN: origin, SSR_API_BASE: "http://api.test", ...env },
  });
}

function jsonFetch(handlerFn) {
  return async (input) => {
    const found = handlerFn(String(input));
    return Response.json(found.body, { status: found.status ?? 200 });
  };
}

async function get(path, fetchImpl, env) {
  const response = await handler(fetchImpl, env).fetch(new Request(`http://ssr.local${path}`));
  return { response, text: await response.text() };
}

describe("vercel serverless entry", () => {
  it("renders the home document with a shared cache", async () => {
    const { response, text } = await get("/", () => {
      throw new Error("home does not fetch");
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("cache-control")).toBe(DOCUMENT_CACHE_CONTROL);
    expect(response.headers.get("cdn-cache-control")).toContain("s-maxage=300");
    expect(response.headers.get("cdn-cache-control")).toContain("stale-while-revalidate=86400");
    expect(response.headers.get("vercel-cdn-cache-control")).toContain(
      "stale-while-revalidate=86400",
    );
    expect(text).toContain("<h1");
    expect(text).toContain("States and territories");
    expect(text).toContain(`window.__SITE_ORIGIN__=${JSON.stringify(origin)}`);
  });

  it("returns 404 noindex for an unknown suburb and does not cache it", async () => {
    const { response, text } = await get(
      "/suburbs/vic/richmond",
      jsonFetch(() => ({
        status: 404,
        body: { detail: "No suburb is on file for vic/richmond." },
      })),
    );
    expect(response.status).toBe(404);
    expect(response.headers.get("x-robots-tag")).toBe("noindex");
    expect(response.headers.get("cache-control")).toBe(NO_STORE_CACHE_CONTROL);
    expect(response.headers.get("cdn-cache-control")).toBe("no-store");
    expect(response.headers.get("vercel-cdn-cache-control")).toBe("no-store");
    expect(text).toContain('name="robots" content="noindex"');
    expect(text).toContain("Richmond");
    expect(text).not.toContain("application/ld+json");
  });

  it("returns an uncached 503 when the API is dead or too slow", async () => {
    const dead = await get("/suburbs/vic/richmond", async () => {
      throw new Error("connect ECONNREFUSED");
    });
    expect(dead.response.status).toBe(503);
    expect(dead.response.headers.get("cache-control")).toBe(NO_STORE_CACHE_CONTROL);
    expect(dead.response.headers.get("cdn-cache-control")).toBe("no-store");
    expect(dead.response.headers.get("vercel-cdn-cache-control")).toBe("no-store");
    expect(dead.text).toContain("Richmond");
    expect(dead.text).not.toContain("application/ld+json");

    const slow = await get("/suburbs/vic/richmond", (_input, init) => {
      return new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(init.signal.reason));
      });
    });
    expect(slow.response.status).toBe(503);
    expect(slow.response.headers.get("cache-control")).toBe(NO_STORE_CACHE_CONTROL);
  }, 5000);

  it("caches a successful suburb and keeps its Place JSON-LD", async () => {
    const { response, text } = await get(
      "/suburbs/vic/richmond",
      jsonFetch((url) => {
        expect(url).toBe("http://api.test/api/v1/suburbs/vic/richmond");
        return { body: suburb };
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-robots-tag")).toBeNull();
    expect(response.headers.get("cache-control")).toBe(DOCUMENT_CACHE_CONTROL);
    expect(response.headers.get("cache-control")).toContain("s-maxage=300");
    expect(response.headers.get("cache-control")).toContain("stale-while-revalidate=86400");
    expect(response.headers.get("cache-control")).not.toContain("no-store");
    const match = text.match(
      /<script type="application\/ld\+json" data-seo="1">([\s\S]*?)<\/script>/,
    );
    expect(match?.[1]).toContain('"@type":"Place"');
    expect(match?.[1]).toContain("https://example.test/suburbs/vic/richmond");
    expect(match?.[1]).not.toContain("Wurundjeri");
  });

  it("301s duplicate URL forms before rendering", async () => {
    const response = await handler(() => {
      throw new Error("redirects do not fetch");
    }).fetch(new Request("http://ssr.local/Suburbs/VIC/Richmond/"));
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("/suburbs/vic/richmond");
    expect(response.headers.get("cache-control")).toContain("s-maxage=86400");

    const sources = await handler(() => {
      throw new Error("redirects do not fetch");
    }).fetch(new Request("http://ssr.local/sources"));
    expect(sources.status).toBe(301);
    expect(sources.headers.get("location")).toBe("/methodology#sources");

    const index = await handler(() => {
      throw new Error("redirects do not fetch");
    }).fetch(new Request("http://ssr.local/index.html"));
    expect(index.status).toBe(301);
    expect(index.headers.get("location")).toBe("/");
  });

  it("serves sitemap and robots from the function", async () => {
    const { response, text } = await get(
      "/sitemap.xml",
      jsonFetch(() => ({
        body: { dataset_connected: false, total: null, suburbs: [], offset: 0, limit: 100 },
      })),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/xml");
    expect(response.headers.get("cache-control")).toContain("s-maxage=300");
    expect(response.headers.get("cache-control")).toContain("stale-while-revalidate=3600");
    expect(text).toContain("https://example.test/rankings/rent");
    expect(text).not.toContain("/suburbs/");

    const robots = await get("/robots.txt", () => {
      throw new Error("robots does not fetch");
    });
    expect(robots.response.status).toBe(200);
    expect(robots.response.headers.get("content-type")).toContain("text/plain");
    expect(robots.text).toContain("Allow: /");
    expect(robots.text).toContain("Disallow: /shortlist");
    expect(robots.text).toContain("Sitemap: https://example.test/sitemap.xml");

    const bare = await get(
      "/robots.txt",
      () => {
        throw new Error("robots does not fetch");
      },
      { VITE_SITE_ORIGIN: "" },
    );
    expect(bare.text).not.toContain("Sitemap:");
  });

  it("proxies /api and /health to the API base and does not cache a dead proxy", async () => {
    const upstream = createServer((req, res) => {
      if (req.url === "/health") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ detail: "missing" }));
    });
    upstream.listen(0, "127.0.0.1");
    await once(upstream, "listening");
    const address = upstream.address();
    const base = `http://127.0.0.1:${address.port}`;
    try {
      const health = await get(
        "/health",
        () => {
          throw new Error("proxy does not use the document fetch");
        },
        { SSR_API_BASE: base },
      );
      expect(health.response.status).toBe(200);
      expect(health.text).toContain('"status":"ok"');

      const missing = await handler(
        () => {
          throw new Error("unused");
        },
        { SSR_API_BASE: base },
      ).fetch(new Request("http://ssr.local/api/v1/suburbs/vic/nope"));
      expect(missing.status).toBe(404);
    } finally {
      upstream.close();
    }

    const down = await get(
      "/api/v1/suburbs",
      () => {
        throw new Error("unused");
      },
      { SSR_API_BASE: "http://127.0.0.1:9" },
    );
    expect(down.response.status).toBe(502);
    expect(down.response.headers.get("cache-control")).toBe(NO_STORE_CACHE_CONTROL);
    expect(down.text).toContain("did not respond");
  });

  it("does not serve static files from the function, and blocks paths outside dist", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ssr-static-"));
    await writeFile(join(dir, "index.html"), "shell");
    await writeFile(join(dir, "app.js"), "console.log(1)");
    expect(await openStatic("/index.html", dir)).toBeNull();
    expect(await openStatic("/../package.json", dir)).toBeNull();
    const file = await openStatic("/app.js", dir);
    expect(file.status).toBe(200);
    expect(await file.text()).toContain("console.log");

    const response = await handleRequest(new Request("http://ssr.local/app.js"), {
      isProd: true,
      serveStatic: false,
      root: dir,
      renderer,
      template,
      env: { VITE_SITE_ORIGIN: origin, SSR_API_BASE: "http://api.test" },
      fetchImpl: async () => {
        throw new Error("not a document");
      },
    });
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("cache-control")).toBe(NO_STORE_CACHE_CONTROL);
  });
});
