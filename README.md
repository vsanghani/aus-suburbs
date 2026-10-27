# Suburb record

A national shell for an Australian suburb record. Search, a map, a long suburb page, councils, ranked lists, a four-place compare, and a match page with personal weights. The product name lives in [`src/config/site.ts`](src/config/site.ts). The npm package name is the only other place it is set.

No suburb rows, geometries, or scraped tables are included. The API returns empty payloads with `dataset_connected: false`. The interface treats that as “not loaded”, which is different from a real zero.

## Stack

Vite, React, TypeScript, and React Router on the frontend. MapLibre GL for maps. Plain CSS with the tokens in `src/styles/tokens.css`. Vitest and Playwright. ESLint and Prettier.

FastAPI under `backend/` for the contract. Settings come from the environment. Alembic is initialised with an empty migration. Docker Compose runs PostGIS, Redis, the API, and a static build of the site.

Vite with a small Node server, not a framework migration. Suburb HTML is rendered per request from the API. There are still no suburb pages to bake at build time. The section registry, the head helper, and the OpenAPI document are the parts that should stay stable while that work happens.

## Run it

Node 22 or newer, Python 3.12, and Docker if you want the databases.

```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install -e "./backend[dev]"
npm install
cp .env.example .env
```

In one terminal:

```bash
make api
```

In another:

```bash
npm run dev
```

`npm run dev` starts the Node server on port 5173. It renders pages and proxies `/api` and `/health` to `http://127.0.0.1:8000`. Leave `VITE_API_BASE` empty for that. Set it, or `SSR_API_BASE`, when the API is hosted elsewhere. Set `VITE_SITE_ORIGIN` (no trailing slash) before you care about canonical links; see `docs/handoff.md`.

`make api` loads `.env` if it exists, then starts uvicorn from `backend/`. Alembic and the catalogue path do not depend on the working directory: the default contracts directory is resolved from the package file.

Full stack, including PostGIS and Redis:

```bash
docker compose up --build
```

The site is on port 8080 and the API on port 8000. Compose does not read `.env`.

## Scripts

| Command            | What it does                                               |
| ------------------ | ---------------------------------------------------------- |
| `npm run dev`      | Node server with Vite middleware (port 5173)               |
| `npm run start`    | Production Node server (port 4173, or `PORT`)              |
| `npm test`         | Vitest                                                     |
| `npm run lint`     | ESLint and Prettier                                        |
| `npm run build`    | Typecheck and production build                             |
| `npm run test:e2e` | Build, then Playwright smoke tests                         |
| `make test`        | Frontend tests and pytest                                  |
| `make lint`        | Frontend lint and Ruff                                     |
| `make openapi`     | Rewrite `contracts/openapi.json` and `src/api/schema.d.ts` |
| `make compose`     | `docker compose up --build`                                |

Backend checks, from `backend/` with the venv active: `ruff check .`, `ruff format --check .`, `pytest`.

## Layout

```
src/config/site.ts          display name
src/styles/tokens.css       colour, type, space
src/metrics/registry.ts     suburb sections
src/api/types.ts            TypeScript contract
src/api/client.ts           fetch wrappers
contracts/formula.json      draft composite, shared
contracts/rankings.json     list questions, shared
contracts/states.json       state names and map centres
contracts/openapi.json      generated OpenAPI
backend/app/api/v1.py       empty /api/v1 routes
backend/alembic/            empty initial migration
docs/design.md              palette, type, space
```

## Add a metric section

Add one object to `registry` in `src/metrics/registry.ts`. Omit `kind` and the generic renderer draws it.

```ts
{
  id: "coast",
  nav: "Coast",
  kicker: "18 — Shore",
  title: "Coast",
  lede: "Distance to the shore, and whether a coastal overlay covers the suburb.",
  slots: [
    { id: "shore-distance", label: "Distance to shore", unit: "m", map: true },
  ],
}
```

That entry adds a sticky-nav link, a section, empty rows, and a source footer. `map: true` also adds the slot to the explorer’s metric menu.

Use `tabs`, `series`, `tables`, or `placeGroups` when the section needs them. Set `kind` only for the four built-in templates: `score`, `metrics` (the default), `commute`, and `nearby`. A new template is a component plus a `kind` branch in `MetricSection`. A new metric does not need one.

The API already accepts any section id inside `SuburbDetail.sections`. The data engineer fills a `SectionPayload` whose `metrics[].id` matches the slot ids. Unknown metric ids still render; the generic block appends them under the configured rows.

## The typed contract

`backend/app/schemas.py` is the source of the HTTP shapes. FastAPI publishes them at `/openapi.json`. `make openapi` writes `contracts/openapi.json` and generates `src/api/schema.d.ts`. The frontend calls the API through `src/api/types.ts`, which mirrors those schemas field for field, in snake_case. Pytest fails if the committed OpenAPI file drifts from the app.

Collection responses include `dataset_connected`. While it is false, the UI says the dataset is not connected. It does not say the query returned zero. `total: null` on a ranking means the same thing. A later implementation sets `dataset_connected: true` and then a zero is a real zero.

Single resources that are absent (`/suburbs/{state}/{slug}`, `/councils/{state}/{slug}`, an unknown list) return 404 with `{ "detail": "..." }`. The page still renders its sections so the shape is visible.

Useful routes:

| Method | Path                              | Empty behaviour                                                         |
| ------ | --------------------------------- | ----------------------------------------------------------------------- |
| GET    | `/health`                         | Process up. Database and Redis report `unconfigured`, `ok`, or `error`. |
| GET    | `/api/v1/search`                  | No matches. `dataset_connected: false`.                                 |
| GET    | `/api/v1/suburbs`                 | Empty page. `dataset_connected: false`. `total: null`.                  |
| GET    | `/api/v1/suburbs/{state}/{slug}`  | 404.                                                                    |
| GET    | `/api/v1/councils`                | Empty list.                                                             |
| GET    | `/api/v1/councils/{state}/{slug}` | 404.                                                                    |
| GET    | `/api/v1/states/{code}`           | State name, no councils.                                                |
| GET    | `/api/v1/rankings`                | The questions from `contracts/rankings.json`.                           |
| GET    | `/api/v1/rankings/{slug}`         | No rows. `total: null`.                                                 |
| GET    | `/api/v1/compare?p=vic:example`   | At most four tokens. No place bodies.                                   |
| GET    | `/api/v1/match`                   | Echoes and normalises weights. No results.                              |
| GET    | `/api/v1/explore`                 | Empty FeatureCollection.                                                |
| GET    | `/api/v1/methodology`             | The draft formula. `sources_connected: false`.                          |
| GET    | `/api/v1/commute`                 | Four modes, `minutes: null`.                                            |
| GET    | `/api/v1/export`                  | Not available.                                                          |

State codes are `nsw`, `vic`, `qld`, `sa`, `wa`, `tas`, `nt`, `act`.

## For the data engineer

Do not seed suburbs into this repo to “make the UI work”. Wire tables, then change the route handlers in `backend/app/api/v1.py` to query them.

- The first real Alembic revision should enable PostGIS and create the tables. `0001_empty` is a placeholder and must stay empty of domain tables.
- `dataset_connected` flips to true only when that query ran.
- Missing inputs are null, not zero. The composite skips a null driver.
- `contracts/formula.json` is the draft: base 50, the group ceilings, the tier words, and the weight ids. Replace the ceilings when you calibrate them, and keep the file and the API in step. The tier word is the highest tier whose `minimum` is less than or equal to the value.
- `ScoreDriver.chart_value` is an optional 0–100 position for the compare chart. `points` stay in the composite’s own units.
- Section payloads use the ids in `src/metrics/registry.ts`. A housing rent figure is `metrics[].id = "median-rent"` with `group: "rent"`.
- `contracts/rankings.json` is the list of questions. A ranking row’s `value` is the raw number the question names (rent, rate, canopy), and `place.score` is the composite when the list is the composite list.
- Crime rates need a plain caveat in `notes`. Footfall inflates counts in busy centres.
- Traditional owners are a string from a source, or null. Do not infer them.
- Geometries belong on `SuburbDetail.geometry` and on `GET /api/v1/explore` as a FeatureCollection. The explorer sends `metric` and `layers`.
- `GET /api/v1/suburbs` is the paged catalogue. The sitemap calls it. Leave it empty, with `dataset_connected: false` and `total: null`, until a query actually ran.
- Commute minutes stay null until a router is actually called.

Postgres in Compose is `postgresql+psycopg://places:places@db:5432/places` inside the network, and `@localhost` from the host. Redis is `redis://redis:6379/0`.

## For the frontend engineer

The pages already handle loading, not-connected, empty, not-found, and transport errors. When a payload arrives, `MetricsBlock` merges it onto the registry slots by id and appends metrics the registry does not know.

- Keep the display name in `src/config/site.ts`.
- Prefer a registry entry over a new component.
- Do not render a sample suburb in production. There is no fixture flag.
- `useApi` aborts on unmount. Encode every input in the key.
- Compare links are `/compare?p=vic:slug&p=nsw:slug` (max four). Match links are the weight query string.
- MapLibre is imported from `MapCanvas` only, so the home bundle does not include it.
- Colours and type are documented in `docs/design.md`. New UI should use the tokens.
- Page titles and social tags go through `src/seo/Head.tsx`. The canonical host is `VITE_SITE_ORIGIN`, read only from `src/config/site.ts`.
- A new suburb section stays one entry in `src/metrics/registry.ts`. Do not add a component for a new metric.

## Deploy the frontend

`npm run build` writes the client to `dist/` and the server bundle to `dist/server/`. `npm run start` serves both. Document requests are rendered; hashed files under `dist/assets` are static. Unknown paths are rendered, not rewritten to an empty `index.html`.

Set `VITE_SITE_ORIGIN` to the public origin and `SSR_API_BASE` to the API the server can reach. The browser keeps calling `/api` on the same host; the Node process proxies it.

**Docker Compose.** The `web` service is that Node server, on port 8080. `deploy/nginx.conf` is the previous static image and is not what Compose runs.

**Vercel and Cloudflare Pages.** `vercel.json` and `public/_redirects` still fall back to the client shell. Those hosts do not run the renderer, so suburb HTML is not unique there. Use them only as a client fallback. The SEO notes in `docs/handoff.md` explain the gap.

The API is a container. Compose is the local shape; the same image runs anywhere that can host a container next to PostGIS and Redis.

## Tests

Frontend unit tests cover the registry, tier words, weight maths, compare tokens, and the empty housing rows. Playwright smoke tests load the home page, a suburb path, compare, the explorer, a ranking, the match sliders, and the dark theme, against a mocked empty API.

Backend tests hit every route with `TestClient` and check that the committed OpenAPI document matches the app. They do not need Postgres.

## Decisions worth a look

- The draft ceilings in `contracts/formula.json` are round numbers so the sum is visible. They are not calibrated.
- The OpenAPI title is “Places API”, so a rename of the product does not touch the backend.
- Database role and database name are `places`, for the same reason.
- Methodology copy is served by the API from `contracts/formula.json`. The score skeleton on a suburb page also imports that file, so the driver labels render before the methodology request returns.
- Suburb pages are client-rendered. Pre-rendering is deferred until there are real paths to render.
- There is no dev fixture of fake suburbs.
