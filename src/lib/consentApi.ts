/**
 * The only module that talks to the consent endpoint.
 *
 * `GET /api/consent` and `POST /api/consent` are same-origin and `no-store`.
 * POST body: `{ "choice": "accept_all" | "essential_only" | "reject_all", "version": <int> }`.
 * Both responses are `{ choice, essential, analytics, version, timestamp, privacySignal? }`.
 * `choice: null` means no decision yet. `privacySignal` is `"gpc" | "dnt" | null` when the
 * server sends it, and absent on older servers. This file does not write cookies and never
 * sets `kf_vid`.
 */
export const CONSENT_ENDPOINT = "/api/consent";

export type ConsentChoiceName = "accept_all" | "essential_only" | "reject_all";
export type PrivacySignal = "gpc" | "dnt";

export type ConsentDecision = {
  choice: ConsentChoiceName | null;
  essential: boolean;
  analytics: boolean;
  version: number | null;
  timestamp: string | null;
  /** Undefined when the server omits the field. Null when the server sends null. */
  privacySignal: PrivacySignal | null | undefined;
};

export type ConsentExchange =
  { status: "ok"; decision: ConsentDecision } | { status: "not-found" } | { status: "failed" };

const CHOICES = new Set<ConsentChoiceName>(["accept_all", "essential_only", "reject_all"]);

function isChoice(value: unknown): value is ConsentChoiceName {
  return typeof value === "string" && CHOICES.has(value as ConsentChoiceName);
}

function emptyDecision(): ConsentDecision {
  return {
    choice: null,
    essential: true,
    analytics: false,
    version: null,
    timestamp: null,
    privacySignal: undefined,
  };
}

export function parseConsentDecision(data: unknown): ConsentDecision | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  if (!("choice" in record)) return null;
  if (record.choice !== null && !isChoice(record.choice)) return null;
  const choice = record.choice === null ? null : record.choice;
  let privacySignal: PrivacySignal | null | undefined;
  if (!("privacySignal" in record)) privacySignal = undefined;
  else if (record.privacySignal === "gpc" || record.privacySignal === "dnt") {
    privacySignal = record.privacySignal;
  } else privacySignal = null;
  const version =
    typeof record.version === "number" && Number.isInteger(record.version) ? record.version : null;
  const timestamp =
    typeof record.timestamp === "string" && record.timestamp.trim() !== ""
      ? record.timestamp
      : null;
  return {
    choice,
    essential: true,
    analytics: record.analytics === true && choice === "accept_all",
    version,
    timestamp,
    privacySignal,
  };
}

async function exchange(method: "GET" | "POST", body?: unknown): Promise<ConsentExchange> {
  try {
    const response = await fetch(CONSENT_ENDPOINT, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        accept: "application/json",
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8_000),
    });
    if (response.status === 404) {
      await response.body?.cancel().catch(() => undefined);
      return { status: "not-found" };
    }
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      return { status: "failed" };
    }
    let data: unknown = null;
    try {
      const text = await response.text();
      data = text ? (JSON.parse(text) as unknown) : null;
    } catch {
      data = null;
    }
    return { status: "ok", decision: parseConsentDecision(data) ?? emptyDecision() };
  } catch {
    return { status: "failed" };
  }
}

export function readConsentFromServer(): Promise<ConsentExchange> {
  return exchange("GET");
}

export function postConsent(body: {
  choice: ConsentChoiceName;
  version: number;
}): Promise<ConsentExchange> {
  return exchange("POST", { choice: body.choice, version: body.version });
}
