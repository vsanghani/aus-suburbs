# Handoff

Open questions for data and SEO. The interface does not invent suburb rows, and it does not decide definitions that belong to a dataset.

## Rendering

Suburb pages are server-rendered by a small Node process (`server/index.mjs`) using Vite's SSR build. The same React tree hydrates in the browser.

This is the least disruptive route that still puts unique HTML at `/suburbs/{state}/{slug}`. A framework migration would replace the router, the data hooks, and the deploy shape for every page. Vite already builds the client; the server only adds a document render and a proxy for `/api`.

What the server does:

- Renders every document request, so titles and meta tags are in the first HTML, not only after JavaScript.
- For a suburb URL, fetches `GET /api/v1/suburbs/{state}/{slug}` and renders that payload when it exists.
- When the API returns 404, still renders the humanised name, the state, and the section skeleton. That shell is unique per URL and does not invent figures.
- Emits JSON-LD only when a real suburb payload was returned.
- Serves `/sitemap.xml` and `/robots.txt` on each request.

Tradeoffs:

- Build time still cannot pre-render suburb URLs. There is no list to walk until `dataset_connected` is true, and inventing slugs is out of scope. On-demand SSR is the stand-in for pre-rendering.
- `npm run dev` and `npm run start` are the Node server. `vite` alone no longer serves the site.
- Docker Compose runs that server. The old nginx image served a static shell and could not give a suburb its own HTML.
- Vercel (`vercel.json`) and Cloudflare Pages (`public/_redirects`) still ship the client bundle as a single-page fallback. Those hosts do not run the Node server, so a crawler that does not execute JavaScript sees the empty shell, not a suburb record. Point production at the Node server (or another host that runs it) before relying on suburb HTML.
- State, council, ranking, and methodology bodies still fill in after hydration. Their titles come from the catalogues in `contracts/`. Only suburb pages are prefetched during the document render. The same `loadSuburb` pattern can be copied for councils if those URLs need the same treatment.
- A dead API during render produces a 503 shell with the place name. The browser then retries. It does not invent a record.

## Canonical host

One value: `VITE_SITE_ORIGIN`, no trailing slash. `src/config/site.ts` (`siteOrigin()`) is the only reader. The Node server reads the same variable at runtime and copies it onto `window.__SITE_ORIGIN__` before hydration, so canonical links, Open Graph URLs, and the sitemap stay on one host even when the client bundle was built without it.

Until it is set, canonical and `og:url` are omitted rather than guessed from the request host. `robots.txt` then has no `Sitemap:` line. Set the production origin before launch.

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
| `/compare`                 | Up to four places. Canonical keeps `?p=state:slug` (max four).                               |
| `/match`                   | Weights. Canonical is `/match` only, so slider query strings are not a pile of indexed URLs. |
| `/methodology`             | Draft formula. `#sources` and `#export` are sections, not extra documents.                   |
| `/sources`                 | Redirects to `/methodology#sources`.                                                         |
| `/privacy`                 | What stays in the browser.                                                                   |
| `/shortlist`               | `noindex`. Personal to one browser. Omitted from the sitemap.                                |

State codes are `nsw`, `vic`, `qld`, `sa`, `wa`, `tas`, `nt`, `act`.

## Meta templates

`src/seo/Head.tsx` is the only writer. It sets `title`, `meta description`, `link rel=canonical`, `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, `og:locale`, `twitter:card`, `twitter:title`, `twitter:description`, and `twitter:url`.

Suburb title: `{name}, {state} · {product}`. Description, in order: `description`, else `blurb`, else a sentence that the record is not on file, else a sentence that names the sections without quoting figures. There is no `og:image`. Nothing in the repo is a share image, and a made-up one would be a lie.

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
- `SuburbDetail.geometry` and `GET /api/v1/explore`: GeoJSON property names the map should read once features exist. The paint is terracotta and ochre at low opacity; the base map stays OpenFreeMap.
- `ScoreDriver.chart_value`: optional 0–100 position for the compare chart. `points` stay in the composite's own units. The ceilings in `contracts/formula.json` are still uncalibrated.
- Commute minutes stay null until a router is actually called.
- `GET /api/v1/suburbs` is the listing the sitemap calls. It returns `dataset_connected: false`, `total: null`, and `suburbs: []` until a query runs. When it flips, page with `limit` (max 500) and `offset`. Do not put rows in this repo to make the sitemap look full.
- `GET /api/v1/councils` has no paging. A national council list may need `limit` and `offset` before the sitemap can walk it safely.
- Ranked lists: `value` is the raw number the question names. `place.score` is the composite only on the composite list.

## Open questions for SEO

- The production value of `VITE_SITE_ORIGIN`.
- Whether `/search` should stay in the sitemap. It is a real page; query variants are separate canonicals only when `?q=` is present.
- Whether `/compare?p=` combinations should stay canonical. They are unique documents, but four-place URLs can multiply once data exists.
- Whether state and council pages need the same server prefetch as suburbs. Today their first HTML has the catalogue title and an empty body.
- Whether a suburb 404 should stay `noindex` (it does). Random slugs would otherwise be an infinite set of thin pages.
- A share image, if one is ever designed. Do not add a default photo of a place.
- Pre-rendering can replace on-demand SSR for the long tail after the listing endpoint is real. Until then, baking HTML at build time has nothing to bake.
- Structured data beyond `Place` (for example a council as `AdministrativeArea`) waits on the same payload fields: name, postcode, centroid, and a description that came from a source.
