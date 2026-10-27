import { randomUUID } from "node:crypto";

import { recordConsentedVisit } from "./visit-record.mjs";

/**
 * First-party consent for the document site.
 *
 * The banner POSTs `{ choice, version }` and then reads `kf_consent` from
 * `document.cookie`, so that cookie is not HttpOnly. `Secure` is added only
 * when the request is https, matching the page's own fallback writer.
 * `kf_vid` stays HttpOnly. The page never creates or clears it.
 *
 * `kf_vid` is set only for a recorded choice of `accept_all`. `Sec-GPC: 1`
 * and `DNT: 1` store `accept_all` as `essential_only` and do not set it.
 * GET never writes, so a read cannot slide a 12-month lifetime forward.
 */

export const CONSENT_PATH = "/api/consent";
export const CONSENT_COOKIE = "kf_consent";
export const VISITOR_COOKIE = "kf_vid";
export const POLICY_VERSION = 1;
/** 365 days. A POST is what starts this window. GET does not renew it. */
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
export const CONSENT_CACHE_CONTROL = "private, no-store";

const CHOICE_ALIASES = new Map([
  ["accept_all", "accept_all"],
  ["all", "accept_all"],
  ["essential_only", "essential_only"],
  ["essential", "essential_only"],
  ["reject_all", "reject_all"],
  ["reject", "reject_all"],
]);
const MAX_BODY_BYTES = 1024;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EXPIRED = "Thu, 01 Jan 1970 00:00:00 GMT";

function privacyOptOut(request) {
  return request.headers.get("sec-gpc") === "1" || request.headers.get("dnt") === "1";
}

function normaliseChoice(value) {
  if (typeof value !== "string") return null;
  return CHOICE_ALIASES.get(value) ?? null;
}

function requestIsHttps(request) {
  if (new URL(request.url).protocol === "https:") return true;
  const forwarded = request.headers.get("x-forwarded-proto");
  if (!forwarded) return false;
  return forwarded.split(",")[0].trim().toLowerCase() === "https";
}

function analyticsAllowed(choice, optOut) {
  return choice === "accept_all" && !optOut;
}

function stateBody({ choice, analytics, version, timestamp, visitorId }) {
  return {
    choice,
    essential: true,
    analytics,
    version,
    timestamp,
    visitorId,
  };
}

function responseHeaders() {
  const headers = new Headers();
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", CONSENT_CACHE_CONTROL);
  headers.set("cdn-cache-control", "no-store");
  headers.set("vercel-cdn-cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("vary", "Cookie, Sec-GPC, DNT");
  return headers;
}

function jsonResponse(status, body, { cookies = [], allow = false } = {}) {
  const headers = responseHeaders();
  if (allow) headers.set("allow", "GET, POST");
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

function jsonError(status, detail, extra) {
  return jsonResponse(status, { detail }, extra);
}

function serializeConsentCookie(value, secure) {
  const secureAttr = secure ? "; Secure" : "";
  return `${CONSENT_COOKIE}=${value}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secureAttr}`;
}

function serializeVisitorCookie(value, maxAge) {
  const parts = [`${VISITOR_COOKIE}=${value}`, "Path=/", `Max-Age=${maxAge}`];
  if (maxAge === 0) parts.push(`Expires=${EXPIRED}`);
  parts.push("SameSite=Lax", "Secure", "HttpOnly");
  return parts.join("; ");
}

function readJar(cookieHeader) {
  const jar = new Map();
  if (!cookieHeader) return jar;
  for (const part of cookieHeader.split(";")) {
    const piece = part.trim();
    if (!piece) continue;
    const eq = piece.indexOf("=");
    if (eq <= 0) continue;
    jar.set(piece.slice(0, eq).trim(), piece.slice(eq + 1).trim());
  }
  return jar;
}

function visitorIdFrom(raw) {
  if (typeof raw !== "string" || !UUID_V4.test(raw)) return null;
  return raw.toLowerCase();
}

function parseConsent(raw) {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 512) return null;
  let text;
  try {
    text = decodeURIComponent(raw);
  } catch {
    return null;
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (data === null || typeof data !== "object" || Array.isArray(data)) return null;
  const keys = Object.keys(data);
  if (keys.length !== 3) return null;
  if (!keys.includes("choice") || !keys.includes("version") || !keys.includes("timestamp")) {
    return null;
  }
  const choice = normaliseChoice(data.choice);
  if (!choice || data.version !== POLICY_VERSION) return null;
  if (typeof data.timestamp !== "string") return null;
  const parsed = Date.parse(data.timestamp);
  if (Number.isNaN(parsed) || new Date(parsed).toISOString() !== data.timestamp) return null;
  return {
    choice,
    version: data.version,
    timestamp: data.timestamp,
  };
}

function encodeConsent(choice, timestamp) {
  return encodeURIComponent(JSON.stringify({ choice, version: POLICY_VERSION, timestamp }));
}

function undecided() {
  return stateBody({
    choice: null,
    analytics: false,
    version: POLICY_VERSION,
    timestamp: null,
    visitorId: null,
  });
}

async function readChoice(request) {
  const declared = request.headers.get("content-length");
  if (declared !== null && /^\d+$/.test(declared) && Number(declared) > MAX_BODY_BYTES) {
    return { error: "Request body is too large." };
  }
  const type = request.headers.get("content-type");
  if (!type) return { error: "Content-Type must be application/json." };
  const mime = type.split(";")[0].trim().toLowerCase();
  if (mime !== "application/json") return { error: "Content-Type must be application/json." };

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return { error: "Request body is too large." };
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { error: "Request body must be JSON." };
  }
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return { error: "Request body must be a JSON object." };
  }
  const keys = Object.keys(data);
  if (!keys.includes("choice") || keys.some((key) => key !== "choice" && key !== "version")) {
    return {
      error:
        'Request body must be { "choice": "accept_all" | "essential_only" | "reject_all", "version"?: 1 }.',
    };
  }
  const choice = normaliseChoice(data.choice);
  if (!choice) {
    return { error: "choice must be accept_all, essential_only, or reject_all." };
  }
  if ("version" in data) {
    if (typeof data.version !== "number" || !Number.isInteger(data.version)) {
      return { error: "version must be an integer." };
    }
    if (data.version !== POLICY_VERSION) return { error: `version must be ${POLICY_VERSION}.` };
  }
  return { choice };
}

async function dispatchConsent(request, options) {
  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "POST") {
    return jsonError(405, "Method not allowed.", { allow: true });
  }
  if (request.headers.get("sec-fetch-site")?.toLowerCase() === "cross-site") {
    return jsonError(403, "Cross-site requests are refused.");
  }

  const now = options.now ?? (() => new Date());
  const randomId = options.randomId ?? (() => randomUUID());
  const recordVisit = options.recordVisit ?? recordConsentedVisit;
  const optOut = privacyOptOut(request);
  const jar = readJar(request.headers.get("cookie"));
  const stored = parseConsent(jar.get(CONSENT_COOKIE));
  const storedVisitorId = visitorIdFrom(jar.get(VISITOR_COOKIE));

  if (method === "GET") {
    if (!stored) return jsonResponse(200, undecided());
    const analytics = analyticsAllowed(stored.choice, optOut);
    return jsonResponse(
      200,
      stateBody({
        choice: stored.choice,
        analytics,
        version: stored.version,
        timestamp: stored.timestamp,
        visitorId: analytics ? storedVisitorId : null,
      }),
    );
  }

  const parsed = await readChoice(request);
  if (parsed.error) return jsonError(400, parsed.error);

  const choice = optOut && parsed.choice === "accept_all" ? "essential_only" : parsed.choice;
  const timestamp = now().toISOString();
  const secure = requestIsHttps(request);
  const cookies = [serializeConsentCookie(encodeConsent(choice, timestamp), secure)];
  let visitorId = null;
  if (choice === "accept_all") {
    visitorId = storedVisitorId ?? randomId();
    if (!UUID_V4.test(visitorId)) {
      throw new Error("Visitor id generator did not return a UUID v4.");
    }
    visitorId = visitorId.toLowerCase();
    cookies.push(serializeVisitorCookie(visitorId, CONSENT_MAX_AGE_SECONDS));
    try {
      await recordVisit({ visitorId, timestamp, version: POLICY_VERSION });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      console.error(`Consented visit hook failed: ${message}`);
    }
  } else {
    cookies.push(serializeVisitorCookie("", 0));
  }

  return jsonResponse(
    200,
    stateBody({
      choice,
      analytics: analyticsAllowed(choice, optOut),
      version: POLICY_VERSION,
      timestamp,
      visitorId: analyticsAllowed(choice, optOut) ? visitorId : null,
    }),
    { cookies },
  );
}

export async function handleConsent(request, options = {}) {
  try {
    return await dispatchConsent(request, options);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(`Consent request failed: ${message}`);
    return jsonError(500, "Consent could not be saved.");
  }
}
