import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { recordConsent, type ConsentChoice } from "../lib/consent";
import { useCookieBannerOpen } from "../lib/useConsent";

const choices: { choice: ConsentChoice; label: string }[] = [
  { choice: "accept_all", label: "Accept all" },
  { choice: "essential_only", label: "Essential only" },
  { choice: "reject_all", label: "Reject all" },
];

/**
 * Non-modal cookie bar. It is not rendered on the server, so the cached HTML
 * stays the same for every visitor. Escape does not record a choice, and focus
 * is not trapped: tabbing leaves the bar and returns to the page.
 */
export function CookieBanner() {
  const open = useCookieBannerOpen();
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const panel = panelRef.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel?.focus({ preventScroll: true });
    return () => {
      if (!previous || previous === panel || !document.contains(previous)) return;
      previous.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  function choose(choice: ConsentChoice) {
    if (busy) return;
    setBusy(true);
    void recordConsent(choice).finally(() => setBusy(false));
  }

  return (
    <div
      ref={panelRef}
      className="cookie-banner"
      role="dialog"
      id="cookie-banner"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-copy"
      aria-busy={busy || undefined}
      tabIndex={-1}
      data-nosnippet=""
    >
      <p id="cookie-banner-title" className="cookie-banner-title">
        Cookies
      </p>
      <p id="cookie-banner-copy" className="cookie-banner-copy">
        Want this site to remember this browser next time? That only happens if you accept.
        Essential only and Reject all leave it off. The choice is stored in a cookie on this
        browser. Details are in the <Link to="/privacy#cookies">privacy note</Link>.
      </p>
      <div className="cookie-actions" role="group" aria-label="Cookie choices">
        {choices.map((item) => (
          <button
            key={item.choice}
            type="button"
            className="cookie-choice"
            disabled={busy}
            onClick={() => choose(item.choice)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
