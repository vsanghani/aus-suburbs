import { handleConsent } from "../server/consent.mjs";

/**
 * Vercel serves this file at `/api/consent` because a filesystem function
 * wins over the catch-all rewrite to `api/ssr.js`. Cached HTML stays on
 * that other function and never sets these cookies.
 */
export function createFetchHandler(options = {}) {
  return {
    async fetch(request) {
      return handleConsent(request, options);
    },
  };
}

export default createFetchHandler();
