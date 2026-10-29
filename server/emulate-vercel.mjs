import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import consent from "../api/consent.js";
import handler from "../api/ssr.js";
import { CONSENT_PATH } from "./consent.mjs";
import { nodeRequestToWeb, openStatic, writeNodeResponse } from "./handle.mjs";

/**
 * Local stand-in for Vercel routing. A filesystem function wins over the
 * catch-all rewrite, so `/api/consent` is `api/consent.js`. A file under
 * dist/ is static. Every other path calls `api/ssr.js`, with the visitor
 * path intact (the request.path transform does that on Vercel).
 */
const port = Number(process.env.PORT || 4174);
const clientDir = fileURLToPath(new URL("../dist/", import.meta.url));

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname === CONSENT_PATH) {
      const response = await consent.fetch(nodeRequestToWeb(req));
      await writeNodeResponse(res, response);
      return;
    }
    if (req.method === "GET" || req.method === "HEAD") {
      const file = await openStatic(url.pathname, clientDir);
      if (file) {
        await writeNodeResponse(res, file);
        return;
      }
    }
    const response = await handler.fetch(nodeRequestToWeb(req));
    await writeNodeResponse(res, response);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.writeHead(500, {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "private, no-store",
      });
      res.end("The page did not render.");
    } else {
      res.end();
    }
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Vercel routing emulation on http://127.0.0.1:${port}`);
});
