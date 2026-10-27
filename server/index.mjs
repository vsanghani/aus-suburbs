import { createServer } from "node:http";
import handler from "../api/consent.js";
import { CONSENT_PATH } from "./consent.mjs";
import { handleNodeRequest, nodeRequestToWeb, projectRoot, writeNodeResponse } from "./handle.mjs";

const root = projectRoot();
const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || (isProd ? 4173 : 5173));

let vite = null;
if (!isProd) {
  const { createServer: createViteServer } = await import("vite");
  vite = await createViteServer({
    root,
    server: { middlewareMode: true },
    appType: "custom",
  });
}

const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url || "/", "http://localhost").pathname;
    if (pathname === CONSENT_PATH) {
      const response = await handler.fetch(nodeRequestToWeb(req));
      await writeNodeResponse(res, response);
      return;
    }
    if (!isProd && vite) {
      const url = new URL(req.url || "/", "http://localhost");
      const proxied = url.pathname.startsWith("/api/") || url.pathname === "/health";
      if (!proxied) {
        await new Promise((resolve, reject) => {
          vite.middlewares(req, res, (error) => (error ? reject(error) : resolve()));
        });
        if (res.writableEnded) return;
      }
    }
    await handleNodeRequest(req, res, { isProd, root, vite });
  } catch (error) {
    if (vite) vite.ssrFixStacktrace(error);
    console.error(error);
    if (!res.headersSent) {
      res.writeHead(500, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "private, no-store",
      });
      res.end("<p>The page did not render.</p>");
    } else {
      res.end();
    }
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Listening on http://127.0.0.1:${port}`);
});
