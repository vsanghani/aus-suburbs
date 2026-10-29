# Handoff

Open questions for data and SEO. The interface does not invent suburb rows, and it does not decide definitions that belong to a dataset.

## Rendering

Suburb pages are server-rendered by a small Node process (`server/index.mjs`) using Vite's SSR build. The same React tree hydrates in the browser.

This is the least disruptive route that still puts unique HTML at `/suburbs/{state}/{slug}`. A framework migration would replace the router, the data hooks, and the deploy shape for every page. Vite already builds the client; the server only adds a document render and a proxy for `/api`.

What the server does:

- Renders every document request, so titles and meta tags are in the first HTML, not only after JavaScript.
- For a suburb URL, fetches `GET /api/v1/suburbs/{state}/{slug}` and renders that payload when it exists.
- The same prefetch runs for state, council, and ranking URLs, and for methodology, search, compare, match, and explore, so the first HTML includes the API shell instead of a loading line.
- When the API returns 404, still renders the humanised name and the section skeleton. Suburb, council, unknown state, and unknown ranking URLs are HTTP 404 and `noindex` in that first response. A dead API is 503 for those records. The shell does not invent figures.
- Emits JSON-LD only when a real suburb payload was returned. Coordinates outside a valid latitude and longitude are left out. Traditional owners, scores, and population are not copied into the structured data.
- 301s trailing slashes, `/index.html`, and `/sources` (to `/methodology#sources`). State, suburb, council, and ranking paths are lowercased in that redirect. Search `q` and compare `p` are normalised the same way. Match and explore keep their query strings; their canonicals stay `/match` and `/explore`.
- Serves `/sitemap.xml` and `/robots.txt` on each request. `robots.txt` allows `/` and does not disallow CSS, JS, fonts, or other assets. It disallows `/shortlist`.
- Sets cache headers on the response. Successful HTML (including a suburb that was on file) is `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=86400`, with the same `s-maxage` and `stale-while-revalidate` repeated on `CDN-Cache-Control` and `Vercel-CDN-Cache-Control`. Sitemap and robots use `s-maxage=300, stale-while-revalidate=3600`. A 404, a 503, and any other error is `private, no-store` on all three headers. Redirects stay cacheable (`max-age=3600, s-maxage=86400`).

Tradeoffs:

- Build time still cannot pre-render suburb URLs. There is no list to walk until `dataset_connected` is true, and inventing slugs is out of scope. On-demand SSR is the stand-in for pre-rendering. Baking HTML at build time would also freeze whatever the API returned during the build, including a 503 if the API was down, and it cannot answer an unknown slug with a real 404.
- `npm run dev` and `npm run start` are the Node server. `vite` alone no longer serves the site.
- Docker Compose runs that server. The old nginx image served a static shell and could not give a suburb its own HTML. Compose is unchanged: the `web` service still runs `server/index.mjs`.
- Vercel runs the same request handler as a Node.js function (`api/ssr.js`). Hashed files under `dist/assets`, the font files, and `favicon.svg` stay on the CDN. `dist/index.html` is moved to `dist-server/template.html` after the client build so `/` is not a static shell. `vercel.json` rewrites every other path to that function. A rewrite checks the filesystem first (static files and other functions), then sets the path the function reads back to the visitor path (`request.path` `/$1` from source `/(.*)`). A named parameter such as `:path*` is not used: an unused name is appended to the function URL as a query string. `/api/consent` is the separate function `api/consent.js`, so the document function does not set cookies. Cloudflare Pages (`public/_redirects`) is still a static shell. It is not the production host.
- State, council, ranking, methodology, search, compare, match, and explore are prefetched during the document render, using the same rule as suburbs: render what the API returned, and do not invent rows. Client navigation still refetches.
- A dead or slow API during render produces a 503 shell with the place name. That response is `private, no-store`, so the CDN does not keep it. The browser then retries. It does not invent a record. The record fetch gives up after 1.2 seconds; that timeout is the "slow API" case.

## Deploy on Vercel

The production host is Vercel. The FastAPI service stays on its own host. The function reaches it over HTTP.

On-demand SSR was chosen over build-time pre-rendering and over a hybrid that bakes the static routes:

- The suburb and council lists are empty until `dataset_connected` is true. A build has nothing honest to walk, and this repo must not invent slugs to fill a sitemap or a set of HTML files.
- Unknown places are an open set. Only a request-time render can return HTTP 404 and `noindex` for a slug that was never built.
- A dead API has to be a 503 that the CDN will not store. A page baked while the API was down would publish that failure until the next build.
- The catalogue will grow to every suburb and council. Pre-rendering that set waits on the API for the whole build and still cannot cover the unknown-slug 404s. The CDN cache (`s-maxage=300`) is what absorbs repeat crawls of pages that rendered successfully.
- Home, states, rankings, and the other fixed routes are rendered by the same function. They are few, they also read the API, and a second HTML pipeline would drift from the Node server. The five-minute CDN cache covers them.

Tradeoffs of the function:

- The first request after a cold start pays for the function boot. Fluid Compute reuses a warm instance after that. Hashed assets do not go through the function.
- Successful pages can be served stale for up to a day while the CDN revalidates. The fresh window is five minutes. A 503 is not stored, so a failed revalidation does not replace a good cached page.
- 404s are not cached either. Every unknown slug hits the function. That is deliberate: a place that appears later must not stay a cached miss.
- Sitemap and robots are rendered per request and cached for five minutes. A disconnected catalogue still adds no place URLs.
- The function bundles the Vite SSR output (`dist-server/`). It does not run Vite on the request.

`npm run emulate:vercel` builds nothing by itself. After `npm run build`, it serves `dist/` as static files, sends `/api/consent` to `api/consent.js`, and sends every other path to `api/ssr.js`, on port 4174. That is the local stand-in for the Vercel routes. `npm run start` remains the Docker and Playwright server. Consent on that server is the same function, answered before the document handler. See `docs/cookies.md`.

### Dashboard

Connect the Git repository in the Vercel dashboard. This repo does not create the project. Framework preset: **Other**. If Vercel suggests Vite, change it. The Vite preset's single-page fallback would serve the empty shell again.

| Setting          | Value                               |
| ---------------- | ----------------------------------- |
| Framework preset | Other                               |
| Install command  | `npm ci` (already in `vercel.json`) |
| Build command    | `npm run build`                     |
| Output directory | `dist`                              |
| Node.js version  | 22.x                                |

`vercel.json` sets the install command, build command, output directory, the rewrite to `api/ssr.js`, and `includeFiles` so the function can read `dist-server/`. `framework` is `null` so the Vite preset cannot add a single-page fallback. Do not add a rewrite to `index.html`. The `routes` `handle: filesystem` phase is not listed here: it is deprecated, and a rewrite already serves a real file from `dist/` before the function runs. Explicit `/assets`, `/fonts`, and `/favicon.svg` headers match the Node server's static cache.

Production branch: whichever branch is production once this work is merged. Preview deployments are created for other branches.

### Environment variables

`VITE_SITE_ORIGIN` is the only canonical origin. Set it on the **Production** environment. The value is a bare `http` or `https` origin with no path and no trailing slash. The owner chooses the production host; this repo does not invent one. The function reads it on each request and copies the normalised value onto `window.__SITE_ORIGIN__`, so canonical links, Open Graph URLs, JSON-LD `url`, and the sitemap use it even when the client bundle was built without it. Leave it unset on Preview unless preview HTML should advertise the production origin. An unset or invalid value omits canonical and `og:url`, and `robots.txt` then has no `Sitemap:` line.

| Variable           | Where                                                        | Required           | What it is                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SITE_ORIGIN` | Production, available at runtime                             | Yes, before launch | Public origin. No path, no trailing slash.                                                                                                                                      |
| `SSR_API_BASE`     | Production and Preview, runtime                              | Yes, on Vercel     | Origin of the deployed FastAPI service, no trailing slash. The function calls it while rendering and proxies browser `/api` and `/health` to it. `/api/consent` is not proxied. |
| `VITE_API_BASE`    | Build, only if the browser should call the API host directly | No                 | Leave empty. The client then calls same-origin `/api`, and the function proxies. If it is set, the API's `CORS_ORIGINS` must include the site origin.                           |

`SSR_API_BASE` wins over `VITE_API_BASE` for server-side fetches. Docker Compose sets `SSR_API_BASE=http://api:8000` and does not need a public origin change. Local `npm run dev` still defaults the API to `http://127.0.0.1:8000` when both are empty.

The function region can be moved next to the API later (Settings → Functions). It is unset here because the API host is not chosen in this repo.

## Canonical host

One value: `VITE_SITE_ORIGIN`, a bare `http` or `https` origin with no path and no trailing slash. `src/config/site.ts` (`normaliseOrigin` / `siteOrigin()`) is the only reader. The Node server and the Vercel function read that same variable, normalise it, and copy it onto `window.__SITE_ORIGIN__` before hydration, so canonical links, Open Graph URLs, JSON-LD `url`, and the sitemap stay on one host even when the client bundle was built without it.

Until it is set, or if it is not a bare origin, canonical and `og:url` are omitted rather than guessed from the request host. `robots.txt` then has no `Sitemap:` line. Set the production origin before launch. Paths in canonicals, the sitemap, and JSON-LD have no trailing slash; the home URL is the origin plus `/`.

## URL structure the interface exposes

| Path                       | HTML                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| `/`                        | Home                                                                                         |
| `/search`                  | Search. Canonical includes `?q=` when a query is present.                                    |
| `/explore`                 | Map. Canonical is `/explore` (metric and layer state stay in the page).                      |
| `/states/{code}`           | State. Codes are the eight in `contracts/states.json`.                                       |
| `/councils/{state}/{slug}` | Council. 404 shell until the API has that council.                                           |
| `/suburbs/{state}/{slug}`  | Suburb. Lowercased. This is the URL that is server-rendered from the API.                    |
| `/rankings`                | List of questions from `contracts/rankings.json`.                                            |
| `/rankings/{slug}`         | One question.                                                                                |
| `/compare`                 | Up to four places. Canonical keeps `?p=state%3Aslug` (max four, lowercased).                 |
| `/match`                   | Weights. Canonical is `/match` only, so slider query strings are not a pile of indexed URLs. |
| `/methodology`             | Draft formula. `#sources` and `#export` are sections, not extra documents.                   |
| `/sources`                 | HTTP 301 to `/methodology#sources`.                                                          |
| `/privacy`                 | What stays in the browser.                                                                   |
| `/shortlist`               | `noindex`. Personal to one browser. Omitted from the sitemap.                                |

State codes are `nsw`, `vic`, `qld`, `sa`, `wa`, `tas`, `nt`, `act`.

## Meta templates

`src/seo/Head.tsx` is the only writer. It sets `title`, `meta description`, `link rel=canonical`, `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, `og:locale`, `og:image` (with width, height, and alt), `twitter:card`, `twitter:title`, `twitter:description`, `twitter:url`, and `twitter:image` (with alt).

Suburb title: `{name}, {state} · {product}`. Other document titles name the page and stay near 60 characters with the product suffix. Description, in order: `description`, else `blurb`, else a sentence that the record is not on file, else a sentence that names the suburb and the sections without quoting figures. Descriptions are clipped near 160 characters. Open Graph and Twitter titles and descriptions are that same page, not the home page. The share picture is `public/share.png` (1200×630). `og:image` and `twitter:image` are that path turned into an absolute URL with the same origin helper as the canonical. When `VITE_SITE_ORIGIN` is empty, those image tags are omitted and the Twitter card stays `summary`. When the origin is set, the card is `summary_large_image`. The picture is the wordmark and the site description. It does not invent figures.

JSON-LD is `Place` (a locality), not `Residence` (a dwelling). It is omitted on 404 and on transport errors. Fields that are null are left out: postcode, description, geo. `addressCountry` is `AU`. Traditional owners are not copied into the structured data; the page shows the string only when the API sends one.

## Sitemap

`GET /sitemap.xml` reads the static route list in `src/seo/sitemap.ts`, then:

- `GET /api/v1/suburbs?limit=&offset=` — suburb URLs only when `dataset_connected` is true and `suburbs` is non-empty. Pages follow `offset` until a short page or `total`.
- `GET /api/v1/councils` — council URLs on the same rule. That list has no paging yet.

A disconnected catalogue adds zero place URLs. The generator does not walk the filesystem or invent slugs.

`GET /robots.txt` allows `/`, disallows `/shortlist`, and points at the sitemap when an origin is set.

## Open questions for data

The section ids and slot ids in `src/metrics/registry.ts` are the contract the page already renders. A new section is one object in that array. These still need a data decision before a number can be honest:

- Which published table, column, year, and geography fill each slot id. The labels are not definitions. Housing, offence rates, NAPLAN, canopy, heat, and noise are the ones most likely to disagree between agencies.
- The unit on each slot (`$/week`, `per 1,000`, `%`) and whether a missing input stays null. The UI prints an em dash for null and only prints zero when the value is zero.
- Crime: the denominator, the year, and the footnote that footfall inflates counts. The page already reserves `notes` for that caveat. Do not send a rate without it.
- Traditional owners: a string from a named source, or null. The UI will not infer one, and JSON-LD does not repeat it.
- `SuburbDetail.geometry` and `GET /api/v1/explore`: GeoJSON property names the map should read once features exist. The paint is navy and mid blue at low opacity; the base map stays OpenFreeMap.
- `ScoreDriver.chart_value`: optional 0–100 position for the compare chart. `points` stay in the composite's own units. The ceilings in `contracts/formula.json` are still uncalibrated.
- Commute minutes stay null until a router is actually called.
- `GET /api/v1/suburbs` is the listing the sitemap calls. It returns `dataset_connected: false`, `total: null`, and `suburbs: []` until a query runs. When it flips, page with `limit` (max 500) and `offset`. Do not put rows in this repo to make the sitemap look full.
- `GET /api/v1/councils` has no paging. A national council list may need `limit` and `offset` before the sitemap can walk it safely.
- Ranked lists: `value` is the raw number the question names. `place.score` is the composite only on the composite list.

## Open questions for SEO

- The production value of `VITE_SITE_ORIGIN`.
- Whether `/search` should stay in the sitemap. It is a real page; query variants are separate canonicals only when `?q=` is present.
- Whether `/compare?p=` combinations should stay canonical. They are unique documents, but four-place URLs can multiply once data exists.
- State and council pages are prefetched now, so a missing council is a real 404 in the first HTML. Whether that prefetch should stay once a dataset is connected is still worth a look: each document waits on the API, and a dead API holds the render until the request times out.
- Whether a suburb 404 should stay `noindex` (it does). Random slugs would otherwise be an infinite set of thin pages.
- A share image, if one is ever designed. Do not add a default photo of a place.
- Pre-rendering can replace on-demand SSR for the long tail after the listing endpoint is real. Until then, baking HTML at build time has nothing to bake, and Vercel still has to render unknown slugs and API failures on the request.
- Structured data beyond `Place` (for example a council as `AdministrativeArea`) waits on the same payload fields: name, postcode, centroid, and a description that came from a source.
