import {
  postConsent,
  readConsentFromServer,
  type ConsentDecision,
  type PrivacySignal,
} from "./consentApi";

/**
 * First-party consent cookie. Page HTML does not set it.
 *
 * Name: `kf_consent`
 * Value: URI-encoded JSON, no extra whitespace:
 * `{ "choice": "accept_all" | "essential_only" | "reject_all", "version": <int>, "timestamp": "<ISO-8601>" }`
 * Attributes when this client has to write it: `Path=/; Max-Age=31536000; SameSite=Lax`,
 * plus `Secure` on https. Not `HttpOnly` (the page has to read it). No `Domain`.
 *
 * `essential` is always true and is not stored. `analytics` is derived: true only
 * when `choice` is `accept_all` and `version` is the current policy version.
 * A different version parses, but analytics stays off and the banner asks again.
 * The client never creates or clears `kf_vid`. The server does that.
 */
export const CONSENT_COOKIE = "kf_consent";
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
export const CONSENT_CHANGE_EVENT = "kf-consent-change";

export type ConsentChoice = "accept_all" | "essential_only" | "reject_all";

export type Consent = {
  /** Always true. Essential storage does not wait for a choice. */
  essential: true;
  /** True only for a current `accept_all` choice. Gate any analytics on this. */
  analytics: boolean;
  /** Parsed choice, including a stale version. Null when the cookie is missing or invalid. */
  choice: ConsentChoice | null;
  /** Parsed policy version. Null when the cookie is missing or invalid. */
  version: number | null;
  /** Parsed timestamp string. Null when the cookie is missing or invalid. */
  timestamp: string | null;
};

const EMPTY_CONSENT: Consent = Object.freeze({
  essential: true,
  analytics: false,
  choice: null,
  version: null,
  timestamp: null,
});

export const CONSENT_NOTICE =
  "We've kept analytics off because your browser sent a privacy signal.";

const listeners = new Set<() => void>();
let settingsOpen = false;
let cachedKey: string | null = null;
let cachedConsent: Consent = EMPTY_CONSENT;
let privacySignal: PrivacySignal | null | undefined = undefined;
let actionNotice = false;
let noticeDismissed = false;

function isChoice(value: unknown): value is ConsentChoice {
  return value === "accept_all" || value === "essential_only" || value === "reject_all";
}

function parseConsentJson(raw: string): Consent | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    if (!isChoice(record.choice)) return null;
    if (typeof record.version !== "number" || !Number.isInteger(record.version)) return null;
    if (typeof record.timestamp !== "string" || record.timestamp.trim() === "") return null;
    const current = record.version === CONSENT_VERSION;
    return {
      essential: true,
      analytics: current && record.choice === "accept_all",
      choice: record.choice,
      version: record.version,
      timestamp: record.timestamp,
    };
  } catch {
    return null;
  }
}

function parseStored(raw: string | null): Consent {
  if (!raw) return EMPTY_CONSENT;
  const direct = parseConsentJson(raw);
  if (direct) return direct;
  if (!raw.includes("%")) return EMPTY_CONSENT;
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded === raw) return EMPTY_CONSENT;
    return parseConsentJson(decoded) ?? EMPTY_CONSENT;
  } catch {
    return EMPTY_CONSENT;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined" || document.cookie === "") return null;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    if (trimmed.slice(0, eq) !== name) continue;
    return trimmed.slice(eq + 1);
  }
  return null;
}

/** Stable server snapshot. Analytics is off until the browser reads the cookie. */
export function serverConsent(): Consent {
  return EMPTY_CONSENT;
}

/** Read `kf_consent`. Safe to call from analytics code before any tracking runs. */
export function getConsent(): Consent {
  if (typeof document === "undefined") return EMPTY_CONSENT;
  const raw = readCookie(CONSENT_COOKIE);
  const key = raw ?? "";
  if (key === cachedKey) return cachedConsent;
  cachedKey = key;
  cachedConsent = parseStored(raw);
  return cachedConsent;
}

/** True when the stored choice matches the current policy version. */
export function isCurrentConsent(consent: Consent = getConsent()): boolean {
  return consent.choice !== null && consent.version === CONSENT_VERSION;
}

export function serializeConsentCookie(
  choice: ConsentChoice,
  options: { now?: Date; secure?: boolean } = {},
): string {
  const now = options.now ?? new Date();
  const secure =
    options.secure ?? (typeof location !== "undefined" && location.protocol === "https:");
  const value = encodeURIComponent(
    JSON.stringify({
      choice,
      version: CONSENT_VERSION,
      timestamp: now.toISOString(),
    }),
  );
  const secureAttr = secure ? "; Secure" : "";
  return `${CONSENT_COOKIE}=${value}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secureAttr}`;
}

function writeConsentCookie(choice: ConsentChoice, timestamp?: string | null): void {
  let now = new Date();
  if (timestamp) {
    const parsed = new Date(timestamp);
    if (!Number.isNaN(parsed.getTime())) now = parsed;
  }
  document.cookie = serializeConsentCookie(choice, { now });
  cachedKey = null;
}

function browserReportsPrivacySignal(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.globalPrivacyControl === true || nav.doNotTrack === "1";
}

function rememberSignal(decision: ConsentDecision): void {
  privacySignal = decision.privacySignal;
}

function cookieMatches(choice: ConsentChoice, timestamp: string | null): boolean {
  cachedKey = null;
  const current = getConsent();
  return (
    current.choice === choice &&
    current.version === CONSENT_VERSION &&
    (timestamp == null || current.timestamp === timestamp)
  );
}

function adoptChoice(choice: ConsentChoice, timestamp: string | null): void {
  if (!cookieMatches(choice, timestamp)) writeConsentCookie(choice, timestamp);
}

/** A privacy signal from this response, or the older pressed-versus-returned check. */
function signalRequiresNotice(stored: ConsentChoice): boolean {
  if (privacySignal === "gpc" || privacySignal === "dnt") return true;
  if (privacySignal === undefined && stored === "essential_only") return true;
  return false;
}

function settingsNotice(): boolean {
  const consent = getConsent();
  if (consent.choice !== "essential_only" || consent.version !== CONSENT_VERSION) return false;
  if (privacySignal === "gpc" || privacySignal === "dnt") return true;
  if (privacySignal === null) return false;
  return browserReportsPrivacySignal();
}

function notify(): void {
  const consent = getConsent();
  for (const listener of listeners) listener();
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<Consent>(CONSENT_CHANGE_EVENT, { detail: consent }));
}

/** Subscribe to store updates. Used by `useSyncExternalStore`. */
export function subscribeConsentStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Fired on `window` as `kf-consent-change` after a choice is stored.
 * `event.detail` is the next `Consent`. Also returns an unsubscribe function.
 */
export function subscribeConsent(listener: (consent: Consent) => void): () => void {
  const onChange = (event: Event) => {
    const detail = (event as CustomEvent<Consent>).detail;
    listener(detail ?? getConsent());
  };
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
}

/** Banner is closed during server render and the hydration pass. */
export function serverBannerOpen(): boolean {
  return false;
}

export function bannerOpenSnapshot(): boolean {
  return settingsOpen || !isCurrentConsent(getConsent());
}

/** Open the banner again so a stored choice can be changed. */
export function openCookieSettings(): void {
  settingsOpen = true;
  if (settingsNotice()) noticeDismissed = false;
  notify();
}

/** Polite notice. False during server render and until a signal applies. */
export function serverNoticeOpen(): boolean {
  return false;
}

export function consentNoticeOpen(): boolean {
  if (noticeDismissed) return false;
  if (settingsOpen) return settingsNotice();
  return actionNotice;
}

export function dismissConsentNotice(): void {
  noticeDismissed = true;
  notify();
}

/**
 * Read `GET /api/consent`. A returned choice wins. `choice: null` keeps a
 * current cookie when one exists, and means no decision when it does not.
 * A failure or 404 leaves the cookie as the source.
 */
export async function refreshConsentFromServer(): Promise<void> {
  const result = await readConsentFromServer();
  if (result.status === "ok") {
    rememberSignal(result.decision);
    if (result.decision.choice) adoptChoice(result.decision.choice, result.decision.timestamp);
  }
  notify();
}

/**
 * Ask the server to store the choice. The stored choice is the one the POST
 * returns, then the cookie it left behind, not the button that was pressed.
 * If the POST fails or 404s, write `kf_consent` here. Never writes `kf_vid`.
 */
export async function recordConsent(pressed: ConsentChoice): Promise<"server" | "client"> {
  const result = await postConsent({ choice: pressed, version: CONSENT_VERSION });
  let source: "server" | "client" = "client";
  let stored: ConsentChoice = pressed;
  if (result.status === "ok") {
    rememberSignal(result.decision);
    cachedKey = null;
    const fromCookie = getConsent();
    if (result.decision.choice) {
      stored = result.decision.choice;
      adoptChoice(stored, result.decision.timestamp);
      source = "server";
    } else if (fromCookie.choice && isCurrentConsent(fromCookie)) {
      stored = fromCookie.choice;
      source = "server";
    } else {
      writeConsentCookie(pressed);
    }
  } else {
    writeConsentCookie(pressed);
  }
  settingsOpen = false;
  if (source === "server" && pressed === "accept_all" && signalRequiresNotice(stored)) {
    actionNotice = true;
    noticeDismissed = false;
  } else {
    actionNotice = false;
  }
  notify();
  return source;
}

/** Clears module state between tests. */
export function resetConsentStore(): void {
  settingsOpen = false;
  cachedKey = null;
  cachedConsent = EMPTY_CONSENT;
  privacySignal = undefined;
  actionNotice = false;
  noticeDismissed = false;
}
