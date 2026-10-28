import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CONSENT_NOTICE,
  dismissConsentNotice,
  recordConsent,
  refreshConsentFromServer,
  type ConsentChoice,
} from "../lib/consent";
import { useConsentNotice, useCookieBannerOpen } from "../lib/useConsent";

const BODY =
  "We use essential cookies to make this site work. If you choose Accept all, we also set an anonymous ID so we can recognise returning visitors and see how the site is used. Essential only and Reject all keep this off. You can change your choice at any time.";

const choices: { choice: ConsentChoice; label: string }[] = [
  { choice: "accept_all", label: "Accept all" },
  { choice: "essential_only", label: "Essential only" },
  { choice: "reject_all", label: "Reject all" },
];

function PrivacyNotice() {
  return (
    <div className="cookie-notice" role="status" aria-live="polite">
      <p>{CONSENT_NOTICE}</p>
      <button type="button" className="cookie-notice-dismiss" onClick={dismissConsentNotice}>
        Dismiss
      </button>
    </div>
  );
}

/**
 * Non-modal cookie bar. It is not rendered on the server, so the cached HTML
 * stays the same for every visitor. Escape does not record a choice, and focus
 * is not trapped: tabbing leaves the bar and returns to the page.
 */
export function CookieBanner() {
  const open = useCookieBannerOpen();
  const notice = useConsentNotice();
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void refreshConsentFromServer();
  }, []);

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

  function choose(choice: ConsentChoice) {
    if (busy) return;
    setBusy(true);
    void recordConsent(choice).finally(() => setBusy(false));
  }

  const noticeNode = notice ? <PrivacyNotice /> : null;

  if (!open) return noticeNode;

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
      <div className="cookie-banner-scroll">
        <p id="cookie-banner-title" className="cookie-banner-title">
          Cookies
        </p>
        <p id="cookie-banner-copy" className="cookie-banner-copy">
          {BODY}
        </p>
        <p className="cookie-banner-details">
          <Link to="/privacy#cookies">Cookie details</Link>
        </p>
      </div>
      {noticeNode}
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
