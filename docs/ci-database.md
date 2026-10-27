# CI for the database (Neon + Alembic)

Three workflows manage schema changes on the Neon project `kerbfox-data`
(Sydney, Postgres 17). None of them print connection strings, and none of them
change the existing `frontend` and `backend` checks in `ci.yml`.

| Workflow | Trigger | What it does |
| --- | --- | --- |
| `db-migrations-pr.yml` | Pull request touching `backend/alembic/**`, `backend/app/**`, `backend/alembic.ini` or `backend/pyproject.toml` | Forks a throwaway Neon branch from `dev`, runs `alembic upgrade head`, `downgrade base`, `upgrade head`, then always deletes the branch (it also expires after 1 day as a safety net). |
| `db-migrate-dev.yml` | Push to `development` (same paths), or manual | Runs `alembic upgrade head` against the Neon `dev` branch. Runs one at a time, never cancelled mid-run. |
| `db-migrate-prod.yml` | Manual only, from `main`, with a typed confirmation | Runs `alembic upgrade head` against the Neon `main` branch. Uses the `production` environment, which must require a reviewer before the job starts. |

## Secrets and variables needed

| Name | Where | Used by | Notes |
| --- | --- | --- | --- |
| `NEON_API_KEY` | Repository secret | PR workflow | Neon API key able to create and delete branches in `kerbfox-data`. |
| `NEON_PROJECT_ID` | Repository variable or secret | PR workflow | `empty-violet-00517600`. Not sensitive. |
| `DATABASE_URL_DEV` | Repository secret | dev workflow | `kf_loader` role, **direct** (non-pooled) URL for the `dev` branch. |
| `DATABASE_URL_PROD` | `production` environment secret | prod workflow | `kf_loader` role, direct URL for the `main` branch. Scope it to the environment only. |

Either `postgresql://` or `postgresql+psycopg://` URLs work. The workflows convert
them for the psycopg v3 driver the backend uses.

## One-time GitHub setup

1. Add the secrets above (Settings, Secrets and variables, Actions).
2. Create an environment called `production` (Settings, Environments). Turn on
   **Required reviewers** and add `vsanghani`. Optionally restrict deployment branches to `main`.
3. Optional: protect `main` and `development` as already configured. These workflows
   have different job names (`migrate-roundtrip`, `migrate-dev`, `migrate-prod`), so they do
   not affect the required `frontend` and `backend` checks. Add `migrate-roundtrip` as a required check
   only once the secrets exist and Datagedon's migrations have landed.

## Flow

1. Open a PR with a migration. `migrate-roundtrip` proves it applies and reverses on a copy of `dev`.
2. After approval and merge into `development`, `migrate-dev` applies it to the Neon `dev` branch.
3. To release, merge to `main`, then run **DB migrate (production)** from `main` and approve the
   run in the `production` environment prompt.

## Notes

- Alembic keeps its `alembic_version` table in the default schema of the connecting role. `kf_loader`
  must be able to create tables there (or the migrations must set `version_table_schema` to one of
  `raw`, `staging` or `curated`).
- Fork PRs skip the round trip, because GitHub does not give secrets to forks.
