import { postConsent } from "./consentApi";

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

const listeners = new Set<() => void>();
let settingsOpen = false;
let cachedKey: string | null = null;
let cachedConsent: Consent = EMPTY_CONSENT;

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

function writeConsentCookie(choice: ConsentChoice): void {
  document.cookie = serializeConsentCookie(choice);
  cachedKey = null;
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
  notify();
}

/**
 * Ask the server to store the choice. If the POST fails, 404s, or does not
 * leave a current readable `kf_consent`, write that cookie here so the banner
 * does not ask again. Never writes `kf_vid`.
 */
export async function recordConsent(choice: ConsentChoice): Promise<"server" | "client"> {
  const status = await postConsent({ choice, version: CONSENT_VERSION });
  const serverStored = status === "ok" && isCurrentConsent(getConsent());
  if (!serverStored) writeConsentCookie(choice);
  settingsOpen = false;
  notify();
  return serverStored ? "server" : "client";
}

/** Clears module state between tests. */
export function resetConsentStore(): void {
  settingsOpen = false;
  cachedKey = null;
  cachedConsent = EMPTY_CONSENT;
}
