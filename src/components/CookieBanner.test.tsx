import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONSENT_COOKIE,
  CONSENT_NOTICE,
  CONSENT_VERSION,
  getConsent,
  resetConsentStore,
  serializeConsentCookie,
} from "../lib/consent";
import { CookieBanner } from "./CookieBanner";
import { SiteFooter } from "./SiteFooter";

function clearCookies() {
  document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; Path=/`;
  document.cookie = "kf_vid=; Max-Age=0; Path=/";
}

function renderBar() {
  return render(
    <MemoryRouter>
      <main>
        <h1>Richmond</h1>
      </main>
      <button type="button">Before</button>
      <CookieBanner />
      <button type="button">After</button>
      <SiteFooter />
    </MemoryRouter>,
  );
}

describe("CookieBanner", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    clearCookies();
    resetConsentStore();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    clearCookies();
    resetConsentStore();
    vi.unstubAllGlobals();
  });

  it("shows three equal choices on a first visit and stays out of the main content", async () => {
    renderBar();
    const dialog = await screen.findByRole("dialog", { name: "Cookies" });
    expect(dialog).toHaveAttribute("aria-describedby", "cookie-banner-copy");
    expect(dialog).not.toHaveAttribute("aria-modal");
    expect(dialog.closest("main")).toBeNull();
    expect(dialog.querySelector("h1, h2, h3, h4, h5, h6")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Richmond");
    expect(document.getElementById("cookie-banner-copy")).toHaveTextContent(
      "We use essential cookies to make this site work. If you choose Accept all, we also set an anonymous ID so we can recognise returning visitors and see how the site is used. Essential only and Reject all keep this off. You can change your choice at any time.",
    );
    expect(screen.getByRole("link", { name: "Cookie details" })).toHaveAttribute(
      "href",
      "/privacy#cookies",
    );
    expect(screen.getByRole("button", { name: "Reject all" })).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    const buttons = [
      screen.getByRole("button", { name: "Accept all" }),
      screen.getByRole("button", { name: "Essential only" }),
      screen.getByRole("button", { name: "Reject all" }),
    ];
    expect(new Set(buttons.map((button) => button.className)).size).toBe(1);
    expect(buttons.every((button) => button.classList.contains("cookie-choice"))).toBe(true);
    expect(dialog).toHaveFocus();
  });

  it("does not trap focus and does not treat Escape as a choice", async () => {
    const user = userEvent.setup();
    renderBar();
    const dialog = await screen.findByRole("dialog", { name: "Cookies" });
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Before" })).toHaveFocus();
    dialog.focus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Cookie details" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Accept all" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Essential only" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Reject all" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();

    dialog.focus();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Cookies" })).toBeInTheDocument();
    expect(document.cookie).not.toContain(`${CONSENT_COOKIE}=`);
    expect(getConsent().choice).toBeNull();
  });

  it("stores each choice, hides the bar, and can be opened again from the footer", async () => {
    const user = userEvent.setup();
    renderBar();

    await user.click(screen.getByRole("button", { name: "Accept all" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(getConsent()).toMatchObject({ choice: "accept_all", analytics: true, essential: true });
    expect(document.cookie).not.toContain("kf_vid");

    await user.click(screen.getByRole("button", { name: "Cookie settings" }));
    expect(await screen.findByRole("dialog", { name: "Cookies" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Essential only" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(getConsent()).toMatchObject({ choice: "essential_only", analytics: false });

    await user.click(screen.getByRole("button", { name: "Cookie settings" }));
    await user.click(await screen.findByRole("button", { name: "Reject all" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(getConsent()).toMatchObject({ choice: "reject_all", analytics: false });
    expect(document.cookie).not.toContain("kf_vid");
  });

  it("stays hidden when a current choice is already stored, including for a crawler", () => {
    document.cookie = serializeConsentCookie("accept_all", {
      now: new Date("2026-02-02T00:00:00.000Z"),
      secure: false,
    });
    resetConsentStore();
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    );
    renderBar();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Richmond");
  });

  it("still shows for a crawler user agent when no choice is stored", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Googlebot");
    renderBar();
    expect(screen.getByRole("dialog", { name: "Cookies" })).toBeInTheDocument();
  });

  it("is absent from server HTML and hydrates without a mismatch", async () => {
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(
      JSON.stringify({
        choice: "accept_all",
        version: 0,
        timestamp: "2020-01-01T00:00:00.000Z",
      }),
    )}; Path=/`;
    resetConsentStore();
    const ui = (
      <MemoryRouter>
        <CookieBanner />
      </MemoryRouter>
    );
    const html = renderToString(ui);
    expect(html).not.toContain("Accept all");
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain(CONSENT_NOTICE);
    expect(html).not.toContain("essential cookies");

    const errors: unknown[][] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      errors.push(args);
    });
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = html;
    const root = hydrateRoot(container, ui);
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: "Cookies" })).toBeInTheDocument(),
    );
    const hydration = errors
      .flat()
      .map((item) => String(item))
      .join("\n");
    expect(hydration).not.toMatch(/hydration/i);
    expect(getConsent().version).toBe(0);
    expect(getConsent().analytics).toBe(false);
    expect(CONSENT_VERSION).toBe(1);
    root.unmount();
    container.remove();
    spy.mockRestore();
  });

  function decision(
    choice: "accept_all" | "essential_only" | "reject_all" | null,
    privacySignal?: "gpc" | "dnt" | null,
  ) {
    const body: Record<string, unknown> = {
      choice,
      essential: true,
      analytics: choice === "accept_all",
      version: choice ? CONSENT_VERSION : null,
      timestamp: choice ? "2026-08-01T00:00:00.000Z" : null,
    };
    if (privacySignal !== undefined) body.privacySignal = privacySignal;
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  it("shows the notice when Accept all comes back as essential only", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method ?? "GET").toUpperCase();
      if (method === "GET") return new Response(null, { status: 404 });
      return decision("essential_only", "gpc");
    });
    renderBar();
    await user.click(await screen.findByRole("button", { name: "Accept all" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByRole("status")).toHaveTextContent(CONSENT_NOTICE);
    expect(getConsent()).toMatchObject({ choice: "essential_only", analytics: false });
    expect(document.cookie).not.toContain("kf_vid");
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the notice when an older response omits privacySignal and downgrades Accept all", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if ((init?.method ?? "GET").toUpperCase() === "GET")
        return new Response(null, { status: 404 });
      return decision("essential_only");
    });
    renderBar();
    await user.click(await screen.findByRole("button", { name: "Accept all" }));
    expect(await screen.findByRole("status")).toHaveTextContent(CONSENT_NOTICE);
    expect(getConsent().choice).toBe("essential_only");
  });

  it("does not show the notice when the server sends privacySignal null", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if ((init?.method ?? "GET").toUpperCase() === "GET")
        return new Response(null, { status: 404 });
      return decision("essential_only", null);
    });
    renderBar();
    await user.click(await screen.findByRole("button", { name: "Accept all" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(getConsent().choice).toBe("essential_only");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the notice in cookie settings for a stored essential choice and a browser signal", async () => {
    const user = userEvent.setup();
    document.cookie = serializeConsentCookie("essential_only", {
      now: new Date("2026-05-01T00:00:00.000Z"),
      secure: false,
    });
    resetConsentStore();
    Object.defineProperty(navigator, "globalPrivacyControl", { configurable: true, value: true });
    renderBar();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Cookie settings" }));
    expect(await screen.findByRole("status")).toHaveTextContent(CONSENT_NOTICE);
    expect(screen.getByRole("button", { name: "Reject all" })).toBeVisible();
    delete (navigator as { globalPrivacyControl?: boolean }).globalPrivacyControl;
  });

  it("keeps the settings notice off when GET reports privacySignal null", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "doNotTrack", { configurable: true, value: "1" });
    fetchMock.mockImplementation(async () => decision("essential_only", null));
    renderBar();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Cookie settings" }));
    expect(await screen.findByRole("dialog", { name: "Cookies" })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    Object.defineProperty(navigator, "doNotTrack", { configurable: true, value: null });
  });
});
