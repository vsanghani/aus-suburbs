import { handleRequest } from "../server/handle.mjs";

/**
 * One Node.js function for every path that is not already a static file.
 * `vercel.json` sends those requests here and restores the visitor path.
 * Hashed assets stay on the CDN. The SSR bundle is loaded from `dist-server/`
 * at runtime (`includeFiles` in vercel.json) so its relative chunks stay put.
 */
export function createFetchHandler(options = {}) {
  return {
    async fetch(request) {
      return handleRequest(request, {
        ...options,
        isProd: true,
        serveStatic: false,
      });
    },
  };
}

export default createFetchHandler();
