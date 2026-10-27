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

function consentCookie(choice, timestamp = TIMESTAMP) {
  return `${CONSENT_COOKIE}=${consentValue(choice, timestamp)}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax; Secure; HttpOnly`;
}

function visitorCookie(id = VID) {
  return `${VISITOR_COOKIE}=${id}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax; Secure; HttpOnly`;
}

function clearedVisitorCookie() {
  return `${VISITOR_COOKIE}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure; HttpOnly`;
}

function request(method, { body, cookie, headers = {}, path = "/api/consent" } = {}) {
  const init = { method, headers: { ...headers } };
  if (cookie) init.headers.cookie = cookie;
  if (body !== undefined) init.body = body;
  return new Request(`http://ssr.local${path}`, init);
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
    "visitorId",
  ]);
  expect(payload.essential).toBe(true);
  expect(typeof payload.version).toBe("number");
}

describe("POST /api/consent", () => {
  it("records accept-all, sets both cookies, and notifies the visit hook", async () => {
    const { response, cookies, payload, calls } = await send(postChoice("all"));
    expect(response.status).toBe(200);
    expectNoStore(response);
    expectShape(payload);
    expect(payload).toEqual({
      choice: "all",
      essential: true,
      analytics: true,
      version: POLICY_VERSION,
      timestamp: TIMESTAMP,
      visitorId: VID,
    });
    expect(cookies).toEqual([consentCookie("all"), visitorCookie()]);
    expect(cookies.join("\n")).not.toMatch(/Domain=/i);
    expect(cookies.join("\n")).not.toMatch(/SameSite=None/i);
    expect(calls).toEqual([{ visitorId: VID, timestamp: TIMESTAMP, version: POLICY_VERSION }]);
  });

  it("records essential only, expires any visitor id, and does not record a visit", async () => {
    const { response, cookies, payload, calls } = await send(postChoice("essential"));
    expect(response.status).toBe(200);
    expectNoStore(response);
    expect(payload).toMatchObject({
      choice: "essential",
      essential: true,
      analytics: false,
      version: POLICY_VERSION,
      timestamp: TIMESTAMP,
      visitorId: null,
    });
    expect(cookies).toEqual([consentCookie("essential"), clearedVisitorCookie()]);
    expect(calls).toEqual([]);
  });

  it("records reject-all the same way as essential, without a visitor id", async () => {
    const { cookies, payload, calls } = await send(postChoice("reject"));
    expect(payload).toMatchObject({
      choice: "reject",
      essential: true,
      analytics: false,
      visitorId: null,
    });
    expect(cookies).toEqual([consentCookie("reject"), clearedVisitorCookie()]);
    expect(calls).toEqual([]);
  });

  it("clears kf_vid when a previous all choice is downgraded", async () => {
    const first = await send(postChoice("all"));
    const jar = `${CONSENT_COOKIE}=${consentValue("all")}; ${VISITOR_COOKIE}=${VID}`;
    for (const choice of ["essential", "reject"]) {
      const next = await send(postChoice(choice, { cookie: jar }));
      expect(next.payload).toMatchObject({ choice, analytics: false, visitorId: null });
      expect(next.cookies[1]).toBe(clearedVisitorCookie());
      expect(next.calls).toEqual([]);
      const read = await send(
        request("GET", { cookie: `${CONSENT_COOKIE}=${consentValue(choice)}` }),
      );
      expect(read.cookies).toEqual([]);
      expect(read.payload.visitorId).toBeNull();
      expect(read.calls).toEqual([]);
    }
    expect(first.payload.visitorId).toBe(VID);
  });

  it("reuses kf_vid and refreshes its max-age only when the visitor posts all again", async () => {
    const minted = [];
    const again = await send(
      postChoice("all", { cookie: `${VISITOR_COOKIE}=${VID.toUpperCase()}` }),
      {
        randomId: () => {
          minted.push("new");
          return VID_NEXT;
        },
      },
    );
    expect(minted).toEqual([]);
    expect(again.payload.visitorId).toBe(VID);
    expect(again.cookies[1]).toBe(visitorCookie(VID));
    expect(again.calls).toEqual([{ visitorId: VID, timestamp: TIMESTAMP, version: 1 }]);
  });

  it("replaces an invalid kf_vid instead of echoing it", async () => {
    const { payload, cookies } = await send(
      postChoice("all", { cookie: `${VISITOR_COOKIE}=not-a-uuid` }),
    );
    expect(payload.visitorId).toBe(VID);
    expect(cookies[1]).toBe(visitorCookie(VID));
  });

  it("does not let a query string override the JSON choice", async () => {
    const { payload } = await send(
      request("POST", {
        path: "/api/consent?choice=all",
        body: JSON.stringify({ choice: "reject" }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(payload.choice).toBe("reject");
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

  it("accepts a charset on the JSON content type", async () => {
    const { payload } = await send(
      request("POST", {
        body: JSON.stringify({ choice: "essential" }),
        headers: { "content-type": "application/json; charset=utf-8" },
      }),
    );
    expect(payload.choice).toBe("essential");
  });

  it("still saves consent when the visit hook throws", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { response, cookies, payload } = await send(postChoice("all"), {
        recordVisit: async () => {
          throw new Error("writer unavailable");
        },
      });
      expect(response.status).toBe(200);
      expect(payload.visitorId).toBe(VID);
      expect(cookies).toHaveLength(2);
      expect(spy).toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it("returns no-store JSON and no cookies when the handler fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { response, cookies, payload } = await send(postChoice("all"), {
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
      visitorId: null,
    });
    expect(cookies).toEqual([]);
    expect(calls).toEqual([]);
  });

  it("reads a stored choice and does not extend the cookie", async () => {
    const { response, cookies, payload } = await send(
      request("GET", { cookie: `${CONSENT_COOKIE}=${consentValue("essential")}` }),
    );
    expect(response.status).toBe(200);
    expect(cookies).toEqual([]);
    expect(payload).toEqual({
      choice: "essential",
      essential: true,
      analytics: false,
      version: POLICY_VERSION,
      timestamp: TIMESTAMP,
      visitorId: null,
    });
  });

  it("returns the visitor id only while analytics consent is stored", async () => {
    const present = await send(
      request("GET", {
        cookie: `${CONSENT_COOKIE}=${consentValue("all")}; ${VISITOR_COOKIE}=${VID}`,
      }),
    );
    expect(present.payload).toMatchObject({ choice: "all", analytics: true, visitorId: VID });
    expect(present.cookies).toEqual([]);

    const missing = await send(
      request("GET", { cookie: `${CONSENT_COOKIE}=${consentValue("all")}` }),
    );
    expect(missing.payload).toMatchObject({ choice: "all", analytics: true, visitorId: null });

    const junk = await send(
      request("GET", {
        cookie: `${CONSENT_COOKIE}=${consentValue("all")}; ${VISITOR_COOKIE}=not-a-uuid`,
      }),
    );
    expect(junk.payload.visitorId).toBeNull();
    expect(junk.payload.analytics).toBe(true);
  });

  it.each([
    ["malformed", `${CONSENT_COOKIE}=%%%`],
    [
      "wrong version",
      `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify({ choice: "all", version: 0, timestamp: TIMESTAMP }))}`,
    ],
    [
      "extra field",
      `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify({ choice: "all", version: 1, timestamp: TIMESTAMP, extra: true }))}`,
    ],
    [
      "non-canonical time",
      `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify({ choice: "all", version: 1, timestamp: "2026-10-27T10:45:00Z" }))}`,
    ],
  ])("treats a %s consent cookie as undecided", async (label, cookie) => {
    expect(label.length).toBeGreaterThan(0);
    const { cookies, payload } = await send(request("GET", { cookie }));
    expect(payload.choice).toBeNull();
    expect(payload.analytics).toBe(false);
    expect(payload.visitorId).toBeNull();
    expect(cookies).toEqual([]);
  });
});

describe("privacy signals", () => {
  it.each([
    ["Sec-GPC", { "sec-gpc": "1" }],
    ["DNT", { dnt: "1" }],
  ])("records %s opt-out of all as essential and clears kf_vid", async (name, headers) => {
    expect(name.length).toBeGreaterThan(0);
    const jar = `${CONSENT_COOKIE}=${consentValue("all")}; ${VISITOR_COOKIE}=${VID}`;
    const { cookies, payload, calls } = await send(postChoice("all", { cookie: jar, headers }));
    expect(payload).toEqual({
      choice: "essential",
      essential: true,
      analytics: false,
      version: POLICY_VERSION,
      timestamp: TIMESTAMP,
      visitorId: null,
    });
    expect(cookies).toEqual([consentCookie("essential"), clearedVisitorCookie()]);
    expect(calls).toEqual([]);
  });

  it("leaves a stored all choice in place on GET but turns analytics off", async () => {
    const { response, cookies, payload } = await send(
      request("GET", {
        cookie: `${CONSENT_COOKIE}=${consentValue("all")}; ${VISITOR_COOKIE}=${VID}`,
        headers: { "sec-gpc": "1" },
      }),
    );
    expect(response.status).toBe(200);
    expect(cookies).toEqual([]);
    expect(payload).toEqual({
      choice: "all",
      essential: true,
      analytics: false,
      version: POLICY_VERSION,
      timestamp: TIMESTAMP,
      visitorId: null,
    });
  });

  it("does not treat other GPC or DNT values as opt-out", async () => {
    const { payload } = await send(postChoice("all", { headers: { "sec-gpc": "0", dnt: "0" } }));
    expect(payload).toMatchObject({ choice: "all", analytics: true, visitorId: VID });
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

    const cross = await send(postChoice("all", { headers: { "sec-fetch-site": "cross-site" } }));
    expect(cross.response.status).toBe(403);
    expectNoStore(cross.response);
    expect(cross.cookies).toEqual([]);
    expect(cross.payload.detail).toMatch(/Cross-site/);
    expect(cross.calls).toEqual([]);
  });

  it("serves the Vercel function entry and keeps both cookies on a Node response", async () => {
    const response = await createFetchHandler(FIXED).fetch(postChoice("all"));
    expect(response.status).toBe(200);
    const folded = nodeHeadersFromResponse(response);
    expect(folded["set-cookie"]).toEqual([consentCookie("all"), visitorCookie()]);
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
