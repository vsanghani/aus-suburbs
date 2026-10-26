import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { App } from "./App";
import { site } from "./config/site";
import { HeadSinkContext, OriginContext, RouteDataContext, type HeadSnapshot } from "./seo/context";
import { loadSuburb } from "./seo/loadSuburb";
import { renderHead } from "./seo/meta";
import { emptyRouteData, type RoutePayload } from "./seo/routeData";
import { collectPaths, robotsTxt, sitemapXml } from "./seo/sitemap";

export { collectPaths, robotsTxt, sitemapXml };

const SUBURB_PATH = /^\/suburbs\/([a-z]{2,3})\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/i;

function fallback(pathname: string, origin: string): HeadSnapshot {
  const input = {
    title: site.name,
    description: site.description,
    path: pathname || "/",
    status: 200,
  };
  return { ...input, html: renderHead(input, origin) };
}

export async function render(url: string, options: { origin: string; apiBase: string }) {
  const requestUrl = new URL(url, "http://ssr.local");
  const routeData: RoutePayload = emptyRouteData();
  const match = requestUrl.pathname.match(SUBURB_PATH);
  if (match?.[1] && match[2]) {
    routeData.suburb = await loadSuburb(
      match[1].toLowerCase(),
      match[2].toLowerCase(),
      options.apiBase,
    );
  }
  const sink: { current: HeadSnapshot | null } = { current: null };
  const html = renderToString(
    <StrictMode>
      <OriginContext.Provider value={options.origin}>
        <HeadSinkContext.Provider value={sink}>
          <RouteDataContext.Provider value={routeData}>
            <StaticRouter location={url}>
              <App />
            </StaticRouter>
          </RouteDataContext.Provider>
        </HeadSinkContext.Provider>
      </OriginContext.Provider>
    </StrictMode>,
  );
  const snapshot = sink.current ?? fallback(requestUrl.pathname, options.origin);
  return { html, head: snapshot.html, status: snapshot.status, routeData };
}
