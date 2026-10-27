// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createFetchHandler } from "../api/consent.js";
import {
  CONSENT_CACHE_CONTROL,
  CONSENT_COOKIE,
  CONSENT_MAX_AGE_SECONDS,
  POLICY_VERSION,
  VISITOR_COOKIE,
  handleConsent,
} from "./consent.mjs";
import { nodeHeadersFromResponse } from "./handle.mjs";
import { recordConsentedVisit } from "./visit-record.mjs";

const TIMESTAMP = "2026-10-27T10:45:00.000Z";
const VID = "550e8400-e29b-41d4-a716-446655440000";
const VID_NEXT = "6ba7b811-9dad-41d1-80b4-00c04fd430c8";
const FIXED = {
  now: () => new Date(TIMESTAMP),
  randomId: () => VID,
};

function consentValue(choice, timestamp = TIMESTAMP) {
  return encodeURIComponent(JSON.stringify({ choice, version: POLICY_VERSION, timestamp }));
}

function consentCookie(choice, timestamp = TIMESTAMP, secure = false) {
  const secureAttr = secure ? "; Secure" : "";
  return `${CONSENT_COOKIE}=${consentValue(choice, timestamp)}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secureAttr}`;
}

function visitorCookie(id = VID) {
  return `${VISITOR_COOKIE}=${id}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax; Secure; HttpOnly`;
}

function clearedVisitorCookie() {
  return `${VISITOR_COOKIE}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure; HttpOnly`;
}

function request(
  method,
  { body, cookie, headers = {}, path = "/api/consent", origin = "http://ssr.local" } = {},
) {
  const init = { method, headers: { ...headers } };
  if (cookie) init.headers.cookie = cookie;
  if (body !== undefined) init.body = body;
  return new Request(`${origin}${path}`, init);
}

function postChoice(choice, extra) {
  return request("POST", {
    ...extra,
    body: JSON.stringify({ choice }),
    headers: { "content-type": "application/json", ...extra?.headers },
  });
}

async function send(req, options = {}) {
  const calls = [];
  const response = await handleConsent(req, {
    ...FIXED,
    recordVisit: async (visit) => {
      calls.push(visit);
    },
    ...options,
  });
  const cookies = response.headers.getSetCookie();
  const payload = await response.json();
  return { response, cookies, payload, calls };
}

function expectNoStore(response) {
  expect(response.headers.get("cache-control")).toBe(CONSENT_CACHE_CONTROL);
  expect(response.headers.get("cdn-cache-control")).toBe("no-store");
  expect(response.headers.get("vercel-cdn-cache-control")).toBe("no-store");
  expect(response.headers.get("cache-control")).not.toContain("s-maxage");
}

function expectShape(payload) {
  expect(Object.keys(payload)).toEqual([
    "choice",
    "essential",
    "analytics",
    "version",
    "timestamp",
  ]);
  expect(payload).not.toHaveProperty("visitorId");
  expect(JSON.stringify(payload)).not.toContain(VID);
  expect(payload.essential).toBe(true);
  expect(typeof payload.version).toBe("number");
}

describe("POST /api/consent", () => {
  it("records accept-all, sets both cookies, and notifies the visit hook", async () => {
    const { response, cookies, payload, calls } = await send(postChoice("accept_all"));
    expect(response.status).toBe(200);
    expectNoStore(response);
    expectShape(payload);
    expect(payload).toEqual({
      choice: "accept_all",
      essential: true,
      analytics: true,
      version: POLICY_VERSION,
      timestamp: TIMESTAMP,
    });
    expect(cookies).toEqual([consentCookie("accept_all"), visitorCookie()]);
    expect(cookies.join("\n")).not.toMatch(/Domain=/i);
    expect(cookies.join("\n")).not.toMatch(/SameSite=None/i);
    expect(calls).toEqual([{ visitorId: VID, timestamp: TIMESTAMP, version: POLICY_VERSION }]);
  });

  it("records essential only, expires any visitor id, and does not record a visit", async () => {
    const { response, cookies, payload, calls } = await send(postChoice("essential_only"));
    expect(response.status).toBe(200);
    expectNoStore(response);
    expect(payload).toMatchObject({
      choice: "essential_only",
      essential: true,
      analytics: false,
      version: POLICY_VERSION,
      timestamp: TIMESTAMP,
    });
    expect(cookies).toEqual([consentCookie("essential_only"), clearedVisitorCookie()]);
    expect(calls).toEqual([]);
  });

  it("records reject-all the same way as essential, without a visitor id", async () => {
    const { cookies, payload, calls } = await send(postChoice("reject_all"));
    expect(payload).toMatchObject({
      choice: "reject_all",
      essential: true,
      analytics: false,
    });
    expect(cookies).toEqual([consentCookie("reject_all"), clearedVisitorCookie()]);
    expect(calls).toEqual([]);
  });

  it("clears kf_vid when a previous all choice is downgraded", async () => {
    const first = await send(postChoice("accept_all"));
    const jar = `${CONSENT_COOKIE}=${consentValue("accept_all")}; ${VISITOR_COOKIE}=${VID}`;
    for (const choice of ["essential_only", "reject_all"]) {
      const next = await send(postChoice(choice, { cookie: jar }));
      expect(next.payload).toMatchObject({ choice, analytics: false });
      expect(next.payload).not.toHaveProperty("visitorId");
      expect(next.cookies[1]).toBe(clearedVisitorCookie());
      expect(next.calls).toEqual([]);
      const read = await send(
        request("GET", { cookie: `${CONSENT_COOKIE}=${consentValue(choice)}` }),
      );
      expect(read.cookies).toEqual([]);
      expect(read.payload).not.toHaveProperty("visitorId");
      expect(read.calls).toEqual([]);
    }
    expect(first.payload).not.toHaveProperty("visitorId");
    expect(first.cookies[1]).toBe(visitorCookie(VID));
  });

  it("reuses kf_vid and refreshes its max-age only when the visitor posts all again", async () => {
    const minted = [];
    const again = await send(
      postChoice("accept_all", { cookie: `${VISITOR_COOKIE}=${VID.toUpperCase()}` }),
      {
        randomId: () => {
          minted.push("new");
          return VID_NEXT;
        },
      },
    );
    expect(minted).toEqual([]);
    expect(again.payload).not.toHaveProperty("visitorId");
    expect(JSON.stringify(again.payload)).not.toContain(VID);
    expect(again.cookies[1]).toBe(visitorCookie(VID));
    expect(again.calls).toEqual([{ visitorId: VID, timestamp: TIMESTAMP, version: 1 }]);
  });

  it("replaces an invalid kf_vid instead of echoing it", async () => {
    const { payload, cookies } = await send(
      postChoice("accept_all", { cookie: `${VISITOR_COOKIE}=not-a-uuid` }),
    );
    expect(payload).not.toHaveProperty("visitorId");
    expect(JSON.stringify(payload)).not.toContain(VID);
    expect(cookies[1]).toBe(visitorCookie(VID));
  });

  it("does not let a query string override the JSON choice", async () => {
    const { payload } = await send(
      request("POST", {
        path: "/api/consent?choice=all",
        body: JSON.stringify({ choice: "reject_all" }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(payload.choice).toBe("reject_all");
    expect(payload.analytics).toBe(false);
  });

  it.each([
    ["missing content type", request("POST", { body: '{"choice":"all"}' }), "Content-Type"],
    [
      "text body",
      request("POST", { body: '{"choice":"all"}', headers: { "content-type": "text/plain" } }),
      "Content-Type",
    ],
    [
      "invalid json",
      request("POST", { body: "{", headers: { "content-type": "application/json" } }),
      "JSON",
    ],
    [
      "json array",
      request("POST", { body: '["all"]', headers: { "content-type": "application/json" } }),
      "JSON object",
    ],
    [
      "json null",
      request("POST", { body: "null", headers: { "content-type": "application/json" } }),
      "JSON object",
    ],
    [
      "empty object",
      request("POST", { body: "{}", headers: { "content-type": "application/json" } }),
      "choice",
    ],
    [
      "extra property",
      request("POST", {
        body: '{"choice":"all","visitorId":"x"}',
        headers: { "content-type": "application/json" },
      }),
      "choice",
    ],
    [
      "wrong type",
      request("POST", { body: '{"choice":1}', headers: { "content-type": "application/json" } }),
      "choice must be",
    ],
    [
      "unknown choice",
      request("POST", {
        body: '{"choice":"ALL"}',
        headers: { "content-type": "application/json" },
      }),
      "choice must be",
    ],
    [
      "oversized body",
      request("POST", {
        body: `{"choice":"all","pad":"${"x".repeat(1100)}"}`,
        headers: { "content-type": "application/json", "content-length": "1200" },
      }),
      "too large",
    ],
  ])("rejects %s without setting cookies", async (label, req, detail) => {
    expect(label.length).toBeGreaterThan(0);
    const { response, cookies, payload, calls } = await send(req);
    expect(response.status).toBe(400);
    expectNoStore(response);
    expect(payload.detail).toContain(detail);
    expect(Object.keys(payload)).toEqual(["detail"]);
    expect(cookies).toEqual([]);
    expect(calls).toEqual([]);
  });

  it("accepts the banner body, old choice names, and Secure only on https", async () => {
    const banner = await send(
      request("POST", {
        body: JSON.stringify({ choice: "accept_all", version: 1 }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(banner.payload.choice).toBe("accept_all");
    expect(banner.cookies[0]).toBe(consentCookie("accept_all"));
    expect(banner.cookies[0]).not.toMatch(/HttpOnly/i);
    expect(banner.cookies[0]).not.toContain("Secure");
    expect(banner.cookies[1]).toContain("HttpOnly");
    expect(banner.cookies[1]).toContain("Secure");

    for (const [alias, canonical] of [
      ["all", "accept_all"],
      ["essential", "essential_only"],
      ["reject", "reject_all"],
    ]) {
      const next = await send(postChoice(alias));
      expect(next.payload.choice).toBe(canonical);
      const decoded = JSON.parse(decodeURIComponent(next.cookies[0].split(";")[0].split("=")[1]));
      expect(decoded.choice).toBe(canonical);
    }

    const https = await send(
      request("POST", {
        origin: "https://ssr.local",
        body: JSON.stringify({ choice: "reject_all", version: 1 }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(https.cookies[0]).toBe(consentCookie("reject_all", TIMESTAMP, true));
    expect(https.cookies[0]).not.toMatch(/HttpOnly/i);
    expect(https.cookies[1]).toContain("HttpOnly");

    const forwarded = await send(
      request("POST", {
        body: JSON.stringify({ choice: "essential_only", version: 1 }),
        headers: { "content-type": "application/json", "x-forwarded-proto": "https" },
      }),
    );
    expect(forwarded.cookies[0]).toBe(consentCookie("essential_only", TIMESTAMP, true));

    const wrong = await send(
      request("POST", {
        body: JSON.stringify({ choice: "accept_all", version: 2 }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(wrong.response.status).toBe(400);
    expect(wrong.cookies).toEqual([]);
    const textVersion = await send(
      request("POST", {
        body: JSON.stringify({ choice: "accept_all", version: "1" }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(textVersion.response.status).toBe(400);
    expect(textVersion.cookies).toEqual([]);
  });

  it("accepts a charset on the JSON content type", async () => {
    const { payload } = await send(
      request("POST", {
        body: JSON.stringify({ choice: "essential_only" }),
        headers: { "content-type": "application/json; charset=utf-8" },
      }),
    );
    expect(payload.choice).toBe("essential_only");
  });

  it("still saves consent when the visit hook throws", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { response, cookies, payload } = await send(postChoice("accept_all"), {
        recordVisit: async () => {
          throw new Error("writer unavailable");
        },
      });
      expect(response.status).toBe(200);
      expect(payload).not.toHaveProperty("visitorId");
      expect(JSON.stringify(payload)).not.toContain(VID);
      expect(cookies).toHaveLength(2);
      expect(spy).toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it("returns no-store JSON and no cookies when the handler fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { response, cookies, payload } = await send(postChoice("accept_all"), {
        now: () => {
          throw new Error("clock");
        },
      });
      expect(response.status).toBe(500);
      expectNoStore(response);
      expect(payload).toEqual({ detail: "Consent could not be saved." });
      expect(cookies).toEqual([]);
    } finally {
      spy.mockRestore();
    }
  });
});

describe("GET /api/consent", () => {
  it("reports no decision without writing cookies", async () => {
    const { response, cookies, payload, calls } = await send(request("GET"));
    expect(response.status).toBe(200);
    expectNoStore(response);
    expect(payload).toEqual({
      choice: null,
      essential: true,
      analytics: false,
      version: POLICY_VERSION,
      timestamp: null,
    });
    expect(cookies).toEqual([]);
    expect(calls).toEqual([]);
  });

  it("normalises an old choice stored in kf_consent", async () => {
    const { payload } = await send(
      request("GET", { cookie: `${CONSENT_COOKIE}=${consentValue("all")}` }),
    );
    expect(payload.choice).toBe("accept_all");
    expect(payload.analytics).toBe(true);
  });

  it("reads a stored choice and does not extend the cookie", async () => {
    const { response, cookies, payload } = await send(
      request("GET", { cookie: `${CONSENT_COOKIE}=${consentValue("essential_only")}` }),
    );
    expect(response.status).toBe(200);
    expect(cookies).toEqual([]);
    expect(payload).toEqual({
      choice: "essential_only",
      essential: true,
      analytics: false,
      version: POLICY_VERSION,
      timestamp: TIMESTAMP,
    });
  });

  it("does not put kf_vid in the JSON, including when analytics is on", async () => {
    const present = await send(
      request("GET", {
        cookie: `${CONSENT_COOKIE}=${consentValue("accept_all")}; ${VISITOR_COOKIE}=${VID}`,
      }),
    );
    expect(present.payload).toEqual({
      choice: "accept_all",
      essential: true,
      analytics: true,
      version: POLICY_VERSION,
      timestamp: TIMESTAMP,
    });
    expect(JSON.stringify(present.payload)).not.toContain(VID);
    expect(present.cookies).toEqual([]);

    const junk = await send(
      request("GET", {
        cookie: `${CONSENT_COOKIE}=${consentValue("accept_all")}; ${VISITOR_COOKIE}=not-a-uuid`,
      }),
    );
    expect(junk.payload).not.toHaveProperty("visitorId");
    expect(JSON.stringify(junk.payload)).not.toContain("not-a-uuid");
    expect(junk.payload.analytics).toBe(true);
  });

  it.each([
    ["malformed", `${CONSENT_COOKIE}=%%%`],
    [
      "wrong version",
      `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify({ choice: "accept_all", version: 0, timestamp: TIMESTAMP }))}`,
    ],
    [
      "extra field",
      `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify({ choice: "accept_all", version: 1, timestamp: TIMESTAMP, extra: true }))}`,
    ],
    [
      "non-canonical time",
      `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify({ choice: "accept_all", version: 1, timestamp: "2026-10-27T10:45:00Z" }))}`,
    ],
  ])("treats a %s consent cookie as undecided", async (label, cookie) => {
    expect(label.length).toBeGreaterThan(0);
    const { cookies, payload } = await send(request("GET", { cookie }));
    expect(payload.choice).toBeNull();
    expect(payload.analytics).toBe(false);
    expect(payload).not.toHaveProperty("visitorId");
    expect(cookies).toEqual([]);
  });
});

describe("privacy signals", () => {
  it.each([
    ["Sec-GPC", { "sec-gpc": "1" }],
    ["DNT", { dnt: "1" }],
  ])("records %s opt-out of all as essential and clears kf_vid", async (name, headers) => {
    expect(name.length).toBeGreaterThan(0);
    const jar = `${CONSENT_COOKIE}=${consentValue("accept_all")}; ${VISITOR_COOKIE}=${VID}`;
    const { cookies, payload, calls } = await send(
      postChoice("accept_all", { cookie: jar, headers }),
    );
    expect(payload).toEqual({
      choice: "essential_only",
      essential: true,
      analytics: false,
      version: POLICY_VERSION,
      timestamp: TIMESTAMP,
    });
    expect(cookies).toEqual([consentCookie("essential_only"), clearedVisitorCookie()]);
    expect(calls).toEqual([]);
  });

  it("leaves a stored all choice in place on GET but turns analytics off", async () => {
    const { response, cookies, payload } = await send(
      request("GET", {
        cookie: `${CONSENT_COOKIE}=${consentValue("accept_all")}; ${VISITOR_COOKIE}=${VID}`,
        headers: { "sec-gpc": "1" },
      }),
    );
    expect(response.status).toBe(200);
    expect(cookies).toEqual([]);
    expect(payload).toEqual({
      choice: "accept_all",
      essential: true,
      analytics: false,
      version: POLICY_VERSION,
      timestamp: TIMESTAMP,
    });
  });

  it("does not treat other GPC or DNT values as opt-out", async () => {
    const { payload } = await send(
      postChoice("accept_all", { headers: { "sec-gpc": "0", dnt: "0" } }),
    );
    expect(payload).toMatchObject({ choice: "accept_all", analytics: true });
    expect(payload).not.toHaveProperty("visitorId");
  });
});

describe("consent routing guards", () => {
  it("refuses other methods and cross-site fetches without setting cookies", async () => {
    const put = await send(
      request("PUT", { body: "{}", headers: { "content-type": "application/json" } }),
    );
    expect(put.response.status).toBe(405);
    expect(put.response.headers.get("allow")).toBe("GET, POST");
    expectNoStore(put.response);
    expect(put.cookies).toEqual([]);

    const cross = await send(
      postChoice("accept_all", { headers: { "sec-fetch-site": "cross-site" } }),
    );
    expect(cross.response.status).toBe(403);
    expectNoStore(cross.response);
    expect(cross.cookies).toEqual([]);
    expect(cross.payload.detail).toMatch(/Cross-site/);
    expect(cross.calls).toEqual([]);
  });

  it("serves the Vercel function entry and keeps both cookies on a Node response", async () => {
    const response = await createFetchHandler(FIXED).fetch(postChoice("accept_all"));
    expect(response.status).toBe(200);
    const folded = nodeHeadersFromResponse(response);
    expect(folded["set-cookie"]).toEqual([consentCookie("accept_all"), visitorCookie()]);
    expect(folded["cache-control"]).toBe(CONSENT_CACHE_CONTROL);
  });
});

describe("recordConsentedVisit", () => {
  it("accepts an anonymous visit and rejects anything else", async () => {
    await expect(
      recordConsentedVisit({ visitorId: VID, timestamp: TIMESTAMP, version: 1 }),
    ).resolves.toBeUndefined();
    await expect(recordConsentedVisit({ visitorId: VID })).rejects.toThrow(/visitorId/);
  });
});
