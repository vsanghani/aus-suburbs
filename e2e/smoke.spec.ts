import { expect, test } from "@playwright/test";
import formula from "../contracts/formula.json" with { type: "json" };

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

    if (path.includes("/suburbs/") || path.includes("/councils/")) {
      await json({ detail: "No suburb is on file for this path." }, 404);
      return;
    }
    if (path.endsWith("/methodology")) {
      await json(formula);
      return;
    }
    if (path.endsWith("/export")) {
      await json({
        dataset_connected: false,
        available: false,
        row_count: null,
        notice: "Export is not available until a dataset is connected.",
      });
      return;
    }
    if (path.endsWith("/explore")) {
      await json({
        metric: url.searchParams.get("metric") ?? "score",
        state: url.searchParams.get("state"),
        layers: [],
        dataset_connected: false,
        feature_collection: { type: "FeatureCollection", features: [] },
        notice: "No geometries are loaded.",
      });
      return;
    }
    if (path.endsWith("/compare")) {
      await json({
        requested: url.searchParams.getAll("p"),
        dataset_connected: false,
        places: [],
        omitted: [],
        notice: "No dataset is connected, so columns stay empty.",
      });
      return;
    }
    if (path.endsWith("/match")) {
      await json({
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
      });
      return;
    }
    if (path.endsWith("/search")) {
      await json({
        query: url.searchParams.get("q") ?? "",
        limit: 10,
        dataset_connected: false,
        results: [],
        councils: [],
        notice: "No dataset is connected, so the search cannot match places.",
      });
      return;
    }
    if (path.includes("/rankings/")) {
      await json({
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
      });
      return;
    }
    if (path.includes("/states/")) {
      await json({
        code: "vic",
        name: "Victoria",
        dataset_connected: false,
        narrative: null,
        suburb_count: null,
        council_count: null,
        regions: [],
        councils: [],
        notice: "No councils are loaded for this state.",
      });
      return;
    }
    await json({ detail: "Unhandled in the smoke test." }, 404);
  });
});

test("home, suburb, compare, and explore render empty states", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("searchbox", { name: "Suburb, council, or postcode" })).toBeVisible();
  await expect(page.getByText("Empty means the figure is not loaded.")).toBeVisible();

  await page.goto("/suburbs/vic/richmond");
  await expect(page.getByText("Not on file")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Page sections" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Housing" })).toBeVisible();
  await expect(page.getByText("Median weekly rent", { exact: true })).toBeVisible();

  await page.goto("/compare");
  await expect(page.getByRole("heading", { name: "Compare" })).toBeVisible();
  await expect(page.getByText("Seat 1")).toBeVisible();
  await expect(page.getByText("No dataset is connected, so columns stay empty.")).toBeVisible();

  await page.goto("/explore");
  await expect(page.getByRole("heading", { name: "Explore" })).toBeVisible();
  await expect(page.getByText("No geometries are loaded.")).toBeVisible();
});

test("dark theme stays on after reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("suburb HTML is rendered before javascript, and the sitemap stays empty of places", async ({
  request,
}) => {
  const suburb = await request.get("/suburbs/vic/richmond");
  const html = await suburb.text();
  expect(html).toContain("<h1");
  expect(html).toContain("Richmond");
  expect(html).toContain("Victoria");
  expect(html).toContain('rel="canonical" href="http://127.0.0.1:4173/suburbs/vic/richmond"');
  expect(html).toContain('property="og:title"');
  expect(html).toContain('name="twitter:card"');
  expect(html).not.toContain("application/ld+json");

  const sitemap = await request.get("/sitemap.xml");
  const xml = await sitemap.text();
  expect(xml).toContain("http://127.0.0.1:4173/rankings/rent");
  expect(xml).not.toContain("/suburbs/");

  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Sitemap: http://127.0.0.1:4173/sitemap.xml");
});

function setCookies(headers: { name: string; value: string }[]) {
  return headers
    .filter((header) => header.name.toLowerCase() === "set-cookie")
    .map((header) => header.value);
}

test("documents set no cookies, and consent is set by the server", async ({ request }) => {
  const home = await request.get("/");
  expect(home.status()).toBe(200);
  expect(home.headers()["cache-control"]).toContain("s-maxage=300");
  expect(home.headers()["cache-control"]).toContain("stale-while-revalidate=86400");
  expect(setCookies(home.headersArray())).toEqual([]);

  const suburb = await request.get("/suburbs/vic/richmond");
  expect(setCookies(suburb.headersArray())).toEqual([]);

  const essential = await request.post("/api/consent", {
    data: { choice: "essential_only", version: 1 },
  });
  expect(essential.status()).toBe(200);
  expect(essential.headers()["cache-control"]).toBe("private, no-store");
  const essentialBody = await essential.json();
  expect(essentialBody).toEqual({
    choice: "essential_only",
    essential: true,
    analytics: false,
    version: 1,
    timestamp: expect.any(String),
  });
  const essentialCookies = setCookies(essential.headersArray());
  const consentCookie = essentialCookies.find((cookie) => cookie.startsWith("kf_consent="));
  expect(consentCookie).toBeDefined();
  expect(consentCookie).toContain("Max-Age=31536000");
  expect(consentCookie).toContain("Path=/");
  expect(consentCookie).toContain("SameSite=Lax");
  expect(consentCookie).not.toContain("Secure");
  expect(consentCookie).not.toMatch(/HttpOnly/i);
  expect(
    JSON.parse(decodeURIComponent(consentCookie!.split(";")[0].slice("kf_consent=".length))),
  ).toMatchObject({
    choice: "essential_only",
    version: 1,
  });
  const cleared = essentialCookies.find((cookie) => cookie.startsWith("kf_vid="));
  expect(cleared).toContain("HttpOnly");
  expect(cleared).toContain("Secure");
  expect(cleared).toContain("SameSite=Lax");

  const accepted = await request.post("/api/consent", {
    data: { choice: "accept_all", version: 1 },
  });
  expect(accepted.status()).toBe(200);
  const acceptedBody = await accepted.json();
  expect(acceptedBody).not.toHaveProperty("visitorId");
  const acceptedCookies = setCookies(accepted.headersArray());
  const vidCookie = acceptedCookies.find((cookie) => /^kf_vid=[0-9a-f-]{36}/i.test(cookie));
  expect(vidCookie).toMatch(/HttpOnly/);
  expect(vidCookie).toMatch(/Secure/);
  expect(vidCookie).toMatch(/SameSite=Lax/);
  const visitorId = vidCookie?.split(";")[0]?.slice("kf_vid=".length) ?? "";
  expect(visitorId.length).toBeGreaterThan(0);
  expect(JSON.stringify(acceptedBody)).not.toContain(visitorId);

  const optedOut = await request.post("/api/consent", {
    data: { choice: "accept_all", version: 1 },
    headers: { "sec-gpc": "1" },
  });
  expect(optedOut.status()).toBe(200);
  const optedOutBody = await optedOut.json();
  expect(optedOutBody).toEqual({
    choice: "essential_only",
    essential: true,
    analytics: false,
    version: 1,
    timestamp: expect.any(String),
  });
  expect(JSON.stringify(optedOutBody)).not.toContain("visitorId");
  const optedOutCookies = setCookies(optedOut.headersArray());
  const optedOutConsent = optedOutCookies.find((cookie) => cookie.startsWith("kf_consent="));
  expect(
    JSON.parse(decodeURIComponent(optedOutConsent!.split(";")[0].slice("kf_consent=".length)))
      .choice,
  ).toBe("essential_only");
  expect(optedOutCookies.some((cookie) => /kf_vid=[0-9a-f-]{36}/i.test(cookie))).toBe(false);
});

test("match sliders and a ranking list explain the empty record", async ({ page }) => {
  await page.goto("/match");
  await expect(page.getByRole("heading", { name: "Match" })).toBeVisible();
  const slider = page.getByRole("slider", { name: "Housing cost" });
  await slider.fill("90");
  await expect(page).toHaveURL(/budget=90/);
  await expect(page.getByText("No scores are loaded, so nothing can be ranked.")).toBeVisible();

  await page.goto("/rankings/rent");
  await expect(page.getByRole("heading", { name: "Lower rent" })).toBeVisible();
  await expect(page.getByText("This list has no dataset behind it yet.")).toBeVisible();
});
