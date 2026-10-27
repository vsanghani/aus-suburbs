import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { App } from "./App";
import { normaliseOrigin, site } from "./config/site";
import { HeadSinkContext, OriginContext, RouteDataContext, type HeadSnapshot } from "./seo/context";
import { loadRouteData } from "./seo/loadRoute";
import { renderHead } from "./seo/meta";
import { collectPaths, robotsTxt, sitemapXml } from "./seo/sitemap";
import { canonicalRedirect } from "./seo/urls";

export { canonicalRedirect, collectPaths, normaliseOrigin, robotsTxt, sitemapXml };

function fallback(pathname: string, origin: string): HeadSnapshot {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") || "/" : pathname || "/";
  const input = {
    title: site.name,
    description: site.description,
    path,
    status: 200,
  };
  return { ...input, html: renderHead(input, origin) };
}

export async function render(
  url: string,
  options: { origin: string; apiBase: string; fetchImpl?: typeof fetch },
) {
  const requestUrl = new URL(url, "http://ssr.local");
  const origin = normaliseOrigin(options.origin);
  const routeData = await loadRouteData(requestUrl, options.apiBase, options.fetchImpl);
  const sink: { current: HeadSnapshot | null } = { current: null };
  const html = renderToString(
    <StrictMode>
      <OriginContext.Provider value={origin}>
        <HeadSinkContext.Provider value={sink}>
          <RouteDataContext.Provider value={routeData}>
            <StaticRouter location={`${requestUrl.pathname}${requestUrl.search}`}>
              <App />
            </StaticRouter>
          </RouteDataContext.Provider>
        </HeadSinkContext.Provider>
      </OriginContext.Provider>
    </StrictMode>,
  );
  const snapshot = sink.current ?? fallback(requestUrl.pathname, origin);
  return {
    html,
    head: snapshot.html,
    status: snapshot.status,
    robots: snapshot.robots ?? null,
    routeData,
  };
}
