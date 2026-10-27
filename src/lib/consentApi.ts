/**
 * The only module that knows the consent request.
 *
 * Today the server contract is a same-origin POST of
 * `{ "choice": "accept_all" | "essential_only" | "reject_all", "version": <int> }`
 * to `/api/consent`. A 2xx is success. The browser applies any `Set-Cookie`
 * headers from that response. The body is ignored until the final contract
 * says to read it. This file does not write cookies and never sets `kf_vid`.
 */
export const CONSENT_ENDPOINT = "/api/consent";

export type ConsentPostStatus = "ok" | "not-found" | "failed";

export async function postConsent(body: {
  choice: "accept_all" | "essential_only" | "reject_all";
  version: number;
}): Promise<ConsentPostStatus> {
  try {
    const response = await fetch(CONSENT_ENDPOINT, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({ choice: body.choice, version: body.version }),
      signal: AbortSignal.timeout(8_000),
    });
    try {
      await response.body?.cancel();
    } catch {
      // The status is what matters. A body that cannot be cancelled is ignored.
    }
    if (response.ok) return "ok";
    if (response.status === 404) return "not-found";
    return "failed";
  } catch {
    return "failed";
  }
}
