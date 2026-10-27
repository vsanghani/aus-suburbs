import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONSENT_ENDPOINT } from "./consentApi";
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE_SECONDS,
  CONSENT_VERSION,
  bannerOpenSnapshot,
  getConsent,
  isCurrentConsent,
  openCookieSettings,
  recordConsent,
  resetConsentStore,
  serializeConsentCookie,
  subscribeConsent,
} from "./consent";
import { useConsent } from "./useConsent";

function clearCookies() {
  document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; Path=/`;
  document.cookie = "kf_vid=; Max-Age=0; Path=/";
  document.cookie = "other=; Max-Age=0; Path=/";
}

function cookieValue(choice: string, version: number, timestamp: string, extra?: object) {
  return encodeURIComponent(JSON.stringify({ choice, version, timestamp, ...extra }));
}

describe("consent cookie", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    clearCookies();
    resetConsentStore();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    clearCookies();
    resetConsentStore();
    vi.unstubAllGlobals();
  });

  it("treats a missing cookie as essential only, with analytics off", () => {
    expect(getConsent()).toEqual({
      essential: true,
      analytics: false,
      choice: null,
      version: null,
      timestamp: null,
    });
    expect(isCurrentConsent()).toBe(false);
    expect(bannerOpenSnapshot()).toBe(true);
  });

  it("derives analytics from the choice and ignores contradictory fields", () => {
    const now = new Date("2026-04-01T00:00:00.000Z");
    document.cookie = serializeConsentCookie("accept_all", { now, secure: false });
    resetConsentStore();
    expect(getConsent()).toEqual({
      essential: true,
      analytics: true,
      choice: "accept_all",
      version: CONSENT_VERSION,
      timestamp: "2026-04-01T00:00:00.000Z",
    });

    document.cookie = `${CONSENT_COOKIE}=${cookieValue("essential_only", CONSENT_VERSION, "2026-04-02T00:00:00.000Z")}; Path=/`;
    resetConsentStore();
    expect(getConsent()).toMatchObject({
      essential: true,
      analytics: false,
      choice: "essential_only",
    });

    document.cookie = `${CONSENT_COOKIE}=${cookieValue("reject_all", CONSENT_VERSION, "2026-04-03T00:00:00.000Z", { analytics: true, essential: false })}; Path=/`;
    resetConsentStore();
    expect(getConsent()).toMatchObject({
      essential: true,
      analytics: false,
      choice: "reject_all",
      version: CONSENT_VERSION,
    });
  });

  it("asks again when the policy version changes, and keeps analytics off", () => {
    document.cookie = `${CONSENT_COOKIE}=${cookieValue("accept_all", 0, "2020-01-01T00:00:00.000Z")}; Path=/`;
    resetConsentStore();
    expect(getConsent()).toMatchObject({
      analytics: false,
      choice: "accept_all",
      version: 0,
    });
    expect(isCurrentConsent()).toBe(false);
    expect(bannerOpenSnapshot()).toBe(true);
  });

  it("ignores an invalid cookie and a different cookie name", () => {
    document.cookie = "other=1; Path=/";
    document.cookie = `${CONSENT_COOKIE}=not-json; Path=/`;
    resetConsentStore();
    expect(getConsent().choice).toBeNull();
    expect(bannerOpenSnapshot()).toBe(true);

    document.cookie = `${CONSENT_COOKIE}=${cookieValue("nope", CONSENT_VERSION, "2026-01-01T00:00:00.000Z")}; Path=/`;
    resetConsentStore();
    expect(getConsent().choice).toBeNull();
  });

  it("serialises a year-long Lax cookie and Secure only on https", () => {
    const now = new Date("2026-10-27T01:02:03.000Z");
    const httpCookie = serializeConsentCookie("reject_all", { now, secure: false });
    expect(httpCookie).toContain(`${CONSENT_COOKIE}=`);
    expect(httpCookie).toContain(`Max-Age=${CONSENT_MAX_AGE_SECONDS}`);
    expect(httpCookie).toContain("Path=/");
    expect(httpCookie).toContain("SameSite=Lax");
    expect(httpCookie).not.toContain("Secure");
    expect(httpCookie).not.toMatch(/HttpOnly/i);
    expect(httpCookie).not.toMatch(/Domain=/i);
    expect(httpCookie).not.toContain("kf_vid");
    expect(decodeURIComponent(httpCookie.split(";")[0].split("=")[1])).toBe(
      JSON.stringify({
        choice: "reject_all",
        version: CONSENT_VERSION,
        timestamp: "2026-10-27T01:02:03.000Z",
      }),
    );

    expect(serializeConsentCookie("accept_all", { now, secure: true })).toContain("; Secure");
  });

  it("falls back to a client cookie when the endpoint 404s or the network fails", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "missing" }), { status: 404 }),
    );
    const seen: string[] = [];
    const stop = subscribeConsent((consent) => {
      seen.push(consent.choice ?? "none");
    });

    await expect(recordConsent("essential_only")).resolves.toBe("client");
    expect(fetchMock).toHaveBeenCalledWith(
      CONSENT_ENDPOINT,
      expect.objectContaining({ method: "POST", credentials: "same-origin" }),
    );
    const init = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(init?.body))).toEqual({
      choice: "essential_only",
      version: CONSENT_VERSION,
    });
    expect(getConsent()).toMatchObject({
      choice: "essential_only",
      analytics: false,
      essential: true,
      version: CONSENT_VERSION,
    });
    expect(document.cookie).not.toContain("kf_vid");
    expect(seen).toEqual(["essential_only"]);
    expect(bannerOpenSnapshot()).toBe(false);

    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(recordConsent("reject_all")).resolves.toBe("client");
    expect(getConsent().choice).toBe("reject_all");
    expect(getConsent().analytics).toBe(false);
    expect(document.cookie).not.toContain("kf_vid");
    stop();
  });

  it("keeps the server cookie when the POST succeeds and does not invent kf_vid", async () => {
    const timestamp = "2024-05-01T00:00:00.000Z";
    fetchMock.mockImplementationOnce(async () => {
      document.cookie = `${CONSENT_COOKIE}=${cookieValue("accept_all", CONSENT_VERSION, timestamp)}; Path=/`;
      return new Response(null, { status: 204 });
    });
    await expect(recordConsent("accept_all")).resolves.toBe("server");
    expect(getConsent()).toMatchObject({
      choice: "accept_all",
      analytics: true,
      version: CONSENT_VERSION,
      timestamp,
    });
    expect(document.cookie).not.toContain("kf_vid");
  });

  it("writes the client cookie if a 2xx response does not leave a readable choice", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));
    await expect(recordConsent("accept_all")).resolves.toBe("client");
    expect(getConsent().analytics).toBe(true);
    expect(document.cookie).toContain(CONSENT_COOKIE);
    expect(document.cookie).not.toContain("kf_vid");
  });

  it("updates useConsent after a choice is stored", async () => {
    const { result } = renderHook(() => useConsent());
    expect(result.current).toMatchObject({ essential: true, analytics: false, choice: null });
    await recordConsent("accept_all");
    await waitFor(() => expect(result.current.analytics).toBe(true));
    expect(result.current.choice).toBe("accept_all");
    expect(result.current.essential).toBe(true);
  });

  it("opens the banner from settings even after a current choice", () => {
    document.cookie = serializeConsentCookie("reject_all", {
      now: new Date("2026-01-01T00:00:00.000Z"),
      secure: false,
    });
    resetConsentStore();
    expect(bannerOpenSnapshot()).toBe(false);
    openCookieSettings();
    expect(bannerOpenSnapshot()).toBe(true);
  });
});
