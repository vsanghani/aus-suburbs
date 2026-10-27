// @vitest-environment node
import { describe, expect, it } from "vitest";
import formula from "../../contracts/formula.json";
import type { SuburbDetail } from "../api/types";
import { site } from "../config/site";
import { render } from "../entry-server";

const origin = "https://example.test";

function jsonFetch(handler: (url: string) => { status?: number; body: unknown }): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const found = handler(url);
    return Response.json(found.body, { status: found.status ?? 200 });
  }) as typeof fetch;
}

function h1Count(html: string): number {
  return html.match(/<h1\b/g)?.length ?? 0;
}

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
  nearby: [
    {
      state: "VIC",
      slug: "Cremorne",
      name: "Cremorne",
      postcode: null,
      council_name: null,
      council_slug: null,
      region_name: null,
      region_slug: null,
      traditional_owners: null,
      population: null,
      latitude: null,
      longitude: null,
      score: null,
      tier: null,
      blurb: null,
    },
  ],
  ranks: [],
  geometry: null,
} satisfies SuburbDetail;

describe("server rendered documents", () => {
  it("gives the home page its own title, social tags, and a single h1", async () => {
    const page = await render("/", {
      origin,
      apiBase: "http://api.test",
      fetchImpl: jsonFetch(() => {
        throw new Error("home does not fetch");
      }),
    });
    expect(page.status).toBe(200);
    expect(page.head).toContain(`<title>Australian suburbs · ${site.name}</title>`);
    expect(page.head).toContain('property="og:title" content="Australian suburbs');
    expect(page.head).toContain('name="twitter:description"');
    expect(page.head).toContain('rel="canonical" href="https://example.test/"');
    expect(page.head).not.toContain("ld+json");
    expect(h1Count(page.html)).toBe(1);
    expect(page.html).toContain("States and territories");
    expect(page.html).toContain("Cookie settings");
    expect(page.html).not.toContain('role="dialog"');
    expect(page.html).not.toContain(">Accept all<");
  });

  it("renders a suburb 404 without schema and a real suburb with Place data only", async () => {
    const missing = await render("/suburbs/vic/richmond", {
      origin,
      apiBase: "http://api.test",
      fetchImpl: jsonFetch(() => ({
        status: 404,
        body: { detail: "No suburb is on file for vic/richmond." },
      })),
    });
    expect(missing.status).toBe(404);
    expect(missing.robots).toBe("noindex");
    expect(missing.head).toContain('name="robots" content="noindex"');
    expect(missing.head).toContain(
      'rel="canonical" href="https://example.test/suburbs/vic/richmond"',
    );
    expect(missing.head).toContain(
      'property="og:url" content="https://example.test/suburbs/vic/richmond"',
    );
    expect(missing.head).toContain('name="twitter:title"');
    expect(missing.head).not.toContain("ld+json");
    expect(missing.head).not.toContain(`<title>Australian suburbs · ${site.name}</title>`);
    expect(h1Count(missing.html)).toBe(1);
    expect(missing.html).toContain('href="/states/vic"');
    expect(missing.html).toContain("Richmond");

    const found = await render("/suburbs/vic/richmond", {
      origin,
      apiBase: "http://api.test",
      fetchImpl: jsonFetch(() => ({ body: suburb })),
    });
    expect(found.status).toBe(200);
    expect(found.robots).toBeNull();
    const match = found.head.match(
      /<script type="application\/ld\+json" data-seo="1">([\s\S]*?)<\/script>/,
    );
    expect(match?.[1]).toBeTruthy();
    const json = JSON.parse(match?.[1] ?? "{}") as {
      "@type"?: string;
      url?: string;
      geo?: { latitude: number };
      score?: number;
    };
    expect(json["@type"]).toBe("Place");
    expect(json.url).toBe("https://example.test/suburbs/vic/richmond");
    expect(json.geo?.latitude).toBe(-37.82);
    expect(json.score).toBeUndefined();
    expect(match?.[1]).not.toContain("Wurundjeri");
    expect(h1Count(found.html)).toBe(1);
    expect(found.html).toContain('href="/suburbs/vic/cremorne"');
    expect(found.html).toContain('href="/councils/vic/yarra"');
    expect(found.html).toContain("Cookie settings");
    expect(found.html).not.toContain('role="dialog"');
    expect(found.html).not.toContain(">Accept all<");
    expect(found.html).not.toContain("kf_vid");
  });

  it("returns 404 for an unknown state and the catalogue shell for a real one", async () => {
    const unknown = await render("/states/zz", {
      origin,
      apiBase: "http://api.test",
      fetchImpl: jsonFetch(() => {
        throw new Error("unknown states are decided locally");
      }),
    });
    expect(unknown.status).toBe(404);
    expect(unknown.robots).toBe("noindex");
    expect(h1Count(unknown.html)).toBe(1);
    expect(unknown.head).not.toContain("ld+json");

    const state = await render("/states/vic", {
      origin,
      apiBase: "http://api.test",
      fetchImpl: jsonFetch((url) => {
        expect(url).toContain("/api/v1/states/vic");
        return {
          body: {
            code: "vic",
            name: "Victoria",
            dataset_connected: false,
            narrative: null,
            suburb_count: null,
            council_count: null,
            regions: [],
            councils: [],
            notice: "No councils are loaded for this state.",
          },
        };
      }),
    });
    expect(state.status).toBe(200);
    expect(state.head).toContain(`<title>Suburbs in Victoria · ${site.name}</title>`);
    expect(state.head).toContain('property="og:description"');
    expect(state.html).toContain("No councils are loaded for this state.");
    expect(h1Count(state.html)).toBe(1);
    expect(state.head).not.toContain("ld+json");
  });

  it("noindexes a missing council in the first HTML", async () => {
    const page = await render("/councils/vic/yarra", {
      origin,
      apiBase: "http://api.test",
      fetchImpl: jsonFetch(() => ({ status: 404, body: { detail: "No council is on file." } })),
    });
    expect(page.status).toBe(404);
    expect(page.robots).toBe("noindex");
    expect(page.head).toContain(`<title>Yarra council, Victoria · ${site.name}</title>`);
    expect(page.head).toContain('rel="canonical" href="https://example.test/councils/vic/yarra"');
    expect(h1Count(page.html)).toBe(1);
    expect(page.html).toContain('href="/states/vic"');
    expect(page.head).not.toContain("ld+json");
  });

  it("puts ranking, methodology, search, compare, match, and explore copy in the first HTML", async () => {
    const fetchImpl = jsonFetch((url) => {
      if (url.includes("/rankings/rent")) {
        return {
          body: {
            ranking: {
              slug: "rent",
              title: "Lower rent",
              question: "Where is the median weekly rent lowest?",
              unit: "$/week",
              value_label: "Median rent",
            },
            dataset_connected: false,
            total: null,
            offset: 0,
            limit: 50,
            filters: { state: null, region: null, council: null },
            regions: [],
            councils: [],
            rows: [],
            notice: "This list has no dataset behind it yet.",
          },
        };
      }
      if (url.includes("/methodology")) return { body: formula };
      if (url.includes("/export")) {
        return {
          body: {
            dataset_connected: false,
            available: false,
            row_count: null,
            notice: "Export is not available until a dataset is connected.",
          },
        };
      }
      if (url.includes("/search")) {
        return {
          body: {
            query: "richmond",
            limit: 10,
            dataset_connected: false,
            results: [],
            councils: [],
            notice: "No dataset is connected, so the search cannot match places.",
          },
        };
      }
      if (url.includes("/compare")) {
        return {
          body: {
            requested: ["vic:richmond"],
            dataset_connected: false,
            places: [],
            omitted: [],
            notice: "No dataset is connected, so columns stay empty.",
          },
        };
      }
      if (url.includes("/match")) {
        return {
          body: {
            weights: {},
            normalised: {},
            state: null,
            budget_weekly: null,
            commute_to: null,
            needs_schools: false,
            limit: 20,
            dataset_connected: false,
            results: [],
            notice: "No scores are loaded, so nothing can be ranked.",
          },
        };
      }
      if (url.includes("/explore")) {
        return {
          body: {
            metric: "score",
            state: null,
            layers: [],
            dataset_connected: false,
            feature_collection: { type: "FeatureCollection", features: [] },
            notice: "No geometries are loaded.",
          },
        };
      }
      return { status: 404, body: { detail: "Unhandled." } };
    });
    const options = { origin, apiBase: "http://api.test", fetchImpl };

    const ranking = await render("/rankings/rent", options);
    expect(ranking.status).toBe(200);
    expect(ranking.head).toContain("Lower rent by suburb");
    expect(ranking.head).toContain('name="twitter:description"');
    expect(ranking.html).toContain("This list has no dataset behind it yet.");
    expect(h1Count(ranking.html)).toBe(1);

    const missingList = await render("/rankings/not-a-list", options);
    expect(missingList.status).toBe(404);
    expect(missingList.robots).toBe("noindex");

    const method = await render("/methodology", options);
    expect(method.status).toBe(200);
    expect(method.head).toContain("Suburb score methodology");
    expect(method.html).toContain("Draft groups");
    expect(method.html).toContain("Export is not available until a dataset is connected.");
    expect(h1Count(method.html)).toBe(1);
    expect(method.head).not.toContain("ld+json");

    const search = await render("/search?q=richmond", options);
    expect(search.head).toContain("richmond suburb search");
    expect(search.head).toContain('rel="canonical" href="https://example.test/search?q=richmond"');
    expect(search.html).toContain("No dataset is connected, so the search cannot match places.");
    expect(h1Count(search.html)).toBe(1);

    const compare = await render("/compare?p=vic:richmond", options);
    expect(compare.head).toContain("Compare Richmond");
    expect(compare.head).toContain(
      'rel="canonical" href="https://example.test/compare?p=vic%3Arichmond"',
    );
    expect(compare.html).toContain("No dataset is connected, so columns stay empty.");
    expect(h1Count(compare.html)).toBe(1);

    const match = await render("/match", options);
    expect(match.head).toContain("Match suburbs");
    expect(match.head).toContain('rel="canonical" href="https://example.test/match"');
    expect(match.html).toContain("No scores are loaded, so nothing can be ranked.");
    expect(match.html).not.toContain("Sending the weights.");
    expect(h1Count(match.html)).toBe(1);

    const explore = await render("/explore", options);
    expect(explore.head).toContain("Explore the suburb map");
    expect(explore.html).toContain("No geometries are loaded.");
    expect(explore.html).toContain('aria-label="Map of Australia"');
    expect(h1Count(explore.html)).toBe(1);

    const missing = await render("/no-such-page", options);
    expect(missing.status).toBe(404);
    expect(missing.robots).toBe("noindex");
    expect(missing.head).toContain("Page not found");
    expect(h1Count(missing.html)).toBe(1);
    expect(missing.head).not.toContain("ld+json");
  });

  it("omits absolute urls when the origin is not a bare host", async () => {
    const page = await render("/privacy", {
      origin: "https://example.test/app",
      apiBase: "http://api.test",
      fetchImpl: jsonFetch(() => {
        throw new Error("privacy does not fetch");
      }),
    });
    expect(page.head).not.toContain("canonical");
    expect(page.head).not.toContain("og:url");
    expect(page.head).toContain('property="og:title"');
    expect(h1Count(page.html)).toBe(1);
  });
});
