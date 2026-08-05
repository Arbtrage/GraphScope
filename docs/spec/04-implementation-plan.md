# GraphScope — Implementation Plan (Phase 4) — v1.2 Local-Only

| Field | Value |
|---|---|
| Version | 1.2.0 |
| Primary deliverable | Local Mac `.dmg` + static landing page |
| Zero GraphScope servers | Yes |

> **Full sprint detail:** This revision supersedes cloud/microservices/Prisma/Docker inventories from v1.0–1.1. Build **`apps/desktop` + `apps/api` + `database/migrations` + `packages/db` repositories** only.

---

## 1. Apps (v1)

| App | Role |
|---|---|
| `apps/desktop` | Electron — spawn API, window, Keychain IPC |
| `apps/web` | Next.js renderer → `127.0.0.1:47321/graphql` |
| `apps/api` | NestJS monolith — GraphQL + job worker |
| `apps/landing` | **Only maintainer deploy** — Product Hunt CTA → GitHub Releases |
| `apps/cli` | Talks to localhost API |

**Removed:** `gateway`, `*-service` microservices, `docker-compose`, Prisma.

---

## 2. Database (no ORM)

| Path | Purpose |
|---|---|
| `database/migrations/sqlite/V*.sql` | Authoritative DDL |
| `database/migrations/mysql/V*.sql` | Optional dialect |
| `database/docs/DATA_DICTIONARY.md` | Column docs |
| `packages/db/src/repositories/*.ts` | Parameterized SQL |
| `packages/db/src/migrate.ts` | Apply migrations |

Migrations inventory: see [02-local-data-engineering.md](./02-local-data-engineering.md).

---

## 3. Sprint summary (S0–S10)

| Sprint | Focus |
|---|---|
| S0 | Monorepo, Electron, API stub, SQLite V001 |
| S1 | Workspace + GitHub Device Flow + Keychain |
| S2 | Local schema registry + SQL repos + CLI |
| S3 | Parser → `stg_` → `core_` promotion |
| S4 | Execution + SSRF + Keychain env secrets |
| S5 | FTS5 search + Voyager |
| S6 | Analytics marts + AI (user OpenAI key) |
| S7 | Composition checks + macOS notifications |
| S8 | Optional MySQL + soak |
| S9 | Sign/notarize `.dmg`, landing page, **Product Hunt** assets |
| S10 | GA buffer |

---

## 4. GraphQL (single schema)

All resolvers in `apps/api/src/graphql/` — one schema file/codegen output. Modules: Workspace, Catalog, Parser, Execution, Analytics, Ai, Search.

---

## 5. Jobs

`core_job` poller in `apps/api/src/jobs/` — types: `parse.repo`, `schema.check`, `analytics.rollup`, `search.reindex`.

---

## 6. CI/CD

| Workflow | Purpose |
|---|---|
| `ci.yml` | Lint, test, SQLite migration smoke |
| `desktop-smoke.yml` | macOS Electron launch |
| `release-mac.yml` | Sign, notarize, upload `.dmg` to GitHub Releases |
| `deploy-landing.yml` | Static landing only (Vercel/Pages) |

**No** `deploy-staging.yml` for API. **No** GHCR backend images required for v1.

---

## 7. Environment variables

**Local API:** `GRAPHSCOPE_DB_PATH`, `GRAPHSCOPE_DB_ENGINE=sqlite|mysql`, `GRAPHSCOPE_API_PORT=47321`, `GRAPHSCOPE_DATA_DIR`

**Landing:** `NEXT_PUBLIC_GITHUB_RELEASES_URL`, `NEXT_PUBLIC_DOWNLOAD_LATEST`

**CI release:** `APPLE_*`, `CSC_*`, `GH_TOKEN`

**Never on GraphScope servers:** there are none.

---

## 8. Production-ready (v1)

- [ ] Signed `.dmg` on GitHub Releases
- [ ] Landing page live with download link
- [ ] Product Hunt kit in `docs/producthunt/`
- [ ] Fresh Mac install: no Docker, no MySQL, no account
- [ ] SSRF + workspace isolation tests green
- [ ] Migrations idempotent smoke in CI

---

## Document history

| Version | Notes |
|---|---|
| 1.0.0 | Cloud microservices plan |
| 1.1.0 | Desktop + Docker sidecar |
| 1.2.0 | **Local-only, SQLite, no ORM, landing-only deploy** |
