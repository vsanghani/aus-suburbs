import { describe, expect, it } from "vitest";
import type { SuburbDetail } from "../api/types";
import { absoluteUrl, normaliseOrigin, site } from "../config/site";
import {
  compareCopy,
  exploreCopy,
  homeCopy,
  matchCopy,
  methodologyCopy,
  rankingsIndexCopy,
  searchCopy,
  suburbCopy,
} from "./copy";
import { placeJsonLd } from "./jsonld";
import { clipText, pageTitle, renderHead } from "./meta";
import { collectPaths, robotsTxt, sitemapXml, staticPaths } from "./sitemap";

describe("head tags", () => {
  it("writes title, description, canonical, and social tags from one snapshot", () => {
    const html = renderHead(
      {
        title: "Richmond, Victoria",
        description: "A short record.",
        path: "/suburbs/vic/richmond",
      },
      "https://example.test",
    );
    expect(html).toContain("<title>Richmond, Victoria · ");
    expect(html).toContain('name="description" content="A short record."');
    expect(html).toContain('rel="canonical" href="https://example.test/suburbs/vic/richmond"');
    expect(html).toContain('property="og:url" content="https://example.test/suburbs/vic/richmond"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('property="og:image" content="https://example.test/share.png"');
    expect(html).toContain('property="og:image:width" content="1200"');
    expect(html).toContain('property="og:image:height" content="630"');
    expect(html).toContain(`property="og:image:alt" content="${site.name}. ${site.description}"`);
    expect(html).toContain('name="twitter:image" content="https://example.test/share.png"');
    expect(html).toContain(`name="twitter:image:alt" content="${site.name}. ${site.description}"`);
    expect(html).toContain('property="og:title"');
  });

  it("omits absolute urls when no origin is configured", () => {
    const html = renderHead({ title: "Explore", description: "A map.", path: "/explore" }, "");
    expect(html).not.toContain("canonical");
    expect(html).not.toContain("og:url");
    expect(html).not.toContain("og:image");
    expect(html).not.toContain("twitter:image");
    expect(html).toContain('name="twitter:card" content="summary"');
    expect(html).toContain('property="og:title"');
  });
});

describe("suburb copy and json-ld", () => {
  it("describes a missing suburb without inventing figures", () => {
    const copy = suburbCopy("vic", "port-melbourne", null, true);
    expect(copy.title).toBe("Port Melbourne, Victoria");
    expect(copy.description).toBe("No suburb record is on file for Port Melbourne in Victoria.");
    expect(copy.description.length).toBeLessThanOrEqual(160);
    expect(copy.path).toBe("/suburbs/vic/port-melbourne");
    expect(placeJsonLd(null, copy.path, "https://example.test")).toBeNull();
  });

  it("emits Place only when a payload exists, and skips empty fields", () => {
    const place = {
      state: "vic",
      slug: "richmond",
      name: "Richmond",
      postcode: "3121",
      council_name: null,
      council_slug: null,
      region_name: null,
      region_slug: null,
      traditional_owners: null,
      population: null,
      latitude: -37.8,
      longitude: 145.0,
      score: null,
      tier: null,
      blurb: "Inner suburb.",
      description: null,
      description_source: null,
      score_detail: null,
      sections: {},
      nearby: [],
      ranks: [],
      geometry: null,
    } satisfies SuburbDetail;
    const json = placeJsonLd(place, "/suburbs/vic/richmond", "https://example.test");
    expect(json).toMatchObject({
      "@type": "Place",
      name: "Richmond",
      url: "https://example.test/suburbs/vic/richmond",
      description: "Inner suburb.",
    });
    expect(json?.geo).toMatchObject({ latitude: -37.8, longitude: 145.0 });
    const address = json?.address as { postalCode?: string };
    expect(address.postalCode).toBe("3121");
    expect(json).not.toHaveProperty("score");
    const owned = placeJsonLd(
      { ...place, traditional_owners: "Wurundjeri", score: 40, latitude: 999, longitude: 10 },
      "/suburbs/vic/richmond",
      "https://example.test",
    );
    expect(owned?.geo).toBeUndefined();
    expect(JSON.stringify(owned)).not.toContain("Wurundjeri");
    expect(suburbCopy("vic", "richmond", place, false).description).toBe("Inner suburb.");
  });
});

describe("title and description length", () => {
  it("keeps the brand suffix and stays within a sensible length", () => {
    const titled = pageTitle("n".repeat(80));
    expect(titled.endsWith(` · ${site.name}`)).toBe(true);
    expect(titled.length).toBeLessThanOrEqual(60);
    expect(clipText(`${"word ".repeat(40)}end`).length).toBeLessThanOrEqual(160);
    const pages = [
      homeCopy(),
      exploreCopy(),
      matchCopy(),
      methodologyCopy(),
      rankingsIndexCopy(),
      searchCopy(""),
      searchCopy("Richmond"),
      compareCopy([]),
      compareCopy(["vic:richmond", "nsw:newtown"]),
      suburbCopy("vic", "richmond", null, false),
    ];
    for (const page of pages) {
      expect(pageTitle(page.title).length).toBeLessThanOrEqual(60);
      expect(page.description.length).toBeLessThanOrEqual(160);
    }
    expect(new Set(pages.map((page) => page.title)).size).toBe(pages.length);
    expect(homeCopy().description.toLowerCase()).toContain("property");
    expect(suburbCopy("vic", "richmond", null, false).description.toLowerCase()).toContain(
      "suburb",
    );
  });

  it("uses one origin and drops a trailing slash on every absolute url", () => {
    expect(normaliseOrigin("https://example.test/")).toBe("https://example.test");
    expect(normaliseOrigin("https://example.test/app")).toBe("");
    expect(absoluteUrl("/explore/", "https://example.test/")).toBe("https://example.test/explore");
    expect(absoluteUrl("/", "https://Example.test")).toBe("https://example.test/");
    expect(absoluteUrl("/search?q=a", "https://example.test")).toBe(
      "https://example.test/search?q=a",
    );
  });
});

describe("sitemap", () => {
  it("lists the shipped routes and no suburb paths", () => {
    const paths = staticPaths();
    expect(paths).toContain("/");
    expect(paths).toContain("/rankings/rent");
    expect(paths).toContain("/states/vic");
    expect(paths.some((path) => path.startsWith("/suburbs/"))).toBe(false);
    expect(paths).not.toContain("/shortlist");
    expect(paths).not.toContain("/sources");
  });

  it("adds suburb urls only after the listing says the dataset is connected", async () => {
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/suburbs?")) {
        const offset = Number(new URL(url).searchParams.get("offset") ?? "0");
        if (offset === 0) {
          return Response.json({
            state: null,
            dataset_connected: true,
            total: 2,
            offset: 0,
            limit: 100,
            notice: "",
            suburbs: [{ state: "VIC", slug: "Richmond" }],
          });
        }
        return Response.json({
          state: null,
          dataset_connected: true,
          total: 2,
          offset: 1,
          limit: 100,
          notice: "",
          suburbs: [{ state: "nsw", slug: "newtown" }],
        });
      }
      return Response.json({
        state: null,
        dataset_connected: false,
        councils: [],
        notice: "No councils are loaded.",
      });
    }) as typeof fetch;

    const paths = await collectPaths("http://api.test", fetchImpl, 1);
    expect(paths).toContain("/suburbs/vic/richmond");
    expect(paths).toContain("/suburbs/nsw/newtown");
    expect(paths.filter((path) => path.startsWith("/councils/"))).toEqual([]);
  });

  it("keeps the sitemap free of suburb urls while the catalogue is disconnected", async () => {
    const fetchImpl = (async () =>
      Response.json({
        dataset_connected: false,
        suburbs: [],
        councils: [],
        total: null,
        notice: "No dataset is connected, so no suburbs are listed.",
      })) as typeof fetch;
    const paths = await collectPaths("http://api.test", fetchImpl);
    expect(paths.some((path) => path.startsWith("/suburbs/"))).toBe(false);
    const xml = sitemapXml("https://example.test", paths);
    expect(xml).toContain("https://example.test/methodology");
    expect(xml).not.toContain("/suburbs/");
    expect(robotsTxt("https://example.test")).toContain(
      "Sitemap: https://example.test/sitemap.xml",
    );
    expect(robotsTxt("")).not.toContain("Sitemap:");
    const robots = robotsTxt("https://example.test");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Disallow: /shortlist");
    expect(robots).not.toMatch(/Disallow:\s+\/(assets|fonts|static|\*)/);
    expect(robots).not.toMatch(/Disallow:.*\.(css|js|woff2)/);
    for (const loc of xml.match(/<loc>[^<]+<\/loc>/g) ?? []) {
      const href = loc.slice("<loc>".length, -"</loc>".length);
      expect(href.startsWith("https://example.test")).toBe(true);
      const path = href.slice("https://example.test".length);
      if (path !== "/") expect(path.endsWith("/")).toBe(false);
    }
  });
});
