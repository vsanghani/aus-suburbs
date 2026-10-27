/**
 * Plug-in for a later visit write.
 *
 * `handleConsent` calls this only after it has recorded a choice of `all`.
 * It is not called for `essential`, `reject`, a Global Privacy Control or
 * Do Not Track downgrade, a read (`GET /api/consent`), or an invalid body.
 *
 * The argument is the anonymous visitor id, the policy version, and the
 * consent timestamp. It has no IP address, user agent, account, or name.
 *
 * This implementation does nothing. Do not add a database client, a
 * connection string, or any other credential here. The API role on Vercel
 * is read-only. A future writer needs its own limited database role, in a
 * separate change, and must not reuse the read-only API credentials.
 *
 * @param {{ visitorId: string, timestamp: string, version: number }} visit
 * @returns {Promise<void>}
 */
export async function recordConsentedVisit(visit) {
  const visitorId = visit?.visitorId;
  const timestamp = visit?.timestamp;
  const version = visit?.version;
  if (
    typeof visitorId !== "string" ||
    typeof timestamp !== "string" ||
    typeof version !== "number"
  ) {
    throw new Error("recordConsentedVisit expected visitorId, timestamp, and version.");
  }
}
