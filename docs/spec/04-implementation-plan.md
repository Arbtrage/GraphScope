# GraphScope — Implementation Plan (Phase 4) — v1.4 Local + SaaS Stack

| Field | Value |
|---|---|
| Version | 1.4.0 |
| Primary deliverable | Local Mac `.dmg` + static landing page |
| Zero GraphScope servers | Yes |
| Stack | Express, GraphQL, PostgreSQL, Knex, Apollo Client, graphile-worker |

> Build **`apps/desktop` + `apps/web` + `apps/api` + `database/migrations` + `packages/db`** with production-grade Node/Postgres patterns — all running locally.

---

## 1. Apps (v1)

| App | Role |
|---|---|
| `apps/desktop` | Electron — spawn embedded PG, API, worker, Keychain IPC |
| `apps/web` | Next.js renderer + **Apollo Client** + `@graphscope/ui` |
| `apps/api` | **Express** + Apollo Server — GraphQL + graphile-worker |
| `apps/landing` | **Only maintainer deploy** — Product Hunt CTA → GitHub Releases |
| `apps/cli` | Talks to localhost API |

**Removed:** NestJS, Prisma, SQLite, cloud microservices, maintainer API deploy.

---

## 2. Database (Knex + PostgreSQL)

| Path | Purpose |
|---|---|
| `database/knexfile.ts` | dev / test / embedded profiles |
| `database/migrations/*.ts` | Knex migrations (PostgreSQL) |
| `database/seeds/dev_seed.ts` | Demo data |
| `database/docs/DATA_DICTIONARY.md` | Column docs |
| `packages/db/src/knex.ts` | Knex singleton |
| `packages/db/src/repositories/*.ts` | Scoped queries |
| `scripts/migrate.ts` | CLI migrate wrapper |
| `scripts/analytics/*.ts` | Mart rollup scripts |

Migrations inventory: see [02-local-data-engineering.md](./02-local-data-engineering.md).

---

## 3. Sprint summary (S0–S10)

| Sprint | Focus |
|---|---|
| S0 | Monorepo, Electron, Express API stub, embedded PG, Knex V001, **shadcn + tokens** |
| S1 | Workspace + GitHub Device Flow + Keychain |
| S2 | Schema registry + Knex repos + CLI |
| S3 | Parser → `stg_` → `core_` + graphile-worker `parse.repo` |
| S4 | Execution + SSRF + Keychain env secrets |
| S5 | PostgreSQL FTS + Voyager + Apollo Client wiring |
| S6 | Analytics marts + Knex rollup scripts + AI (user OpenAI key) |
| S7 | Composition checks + macOS notifications |
| S8 | Optional local Redis cache + query optimization pass |
| S9 | Sign/notarize `.dmg`, landing page, **Product Hunt** assets |
| S10 | GA buffer + portfolio demo script |

---

## 4. GraphQL (single schema)

- Schema + resolvers in `apps/api/src/graphql/`
- Apollo Server 4 with `expressMiddleware`
- Apollo Client in `apps/web` with codegen types
- Modules: Workspace, Catalog, Parser, Execution, Analytics, Ai, Search

---

## 5. Jobs (graphile-worker)

| Task | Handler |
|---|---|
| `parse.repo` | Clone, parse, promote stg → core |
| `schema.check` | GraphQL Inspector |
| `analytics.rollup` | `scripts/analytics/rollup_workspace_daily.ts` |
| `search.reindex` | Rebuild tsvector indexes |

Worker starts with API process (or dedicated fork from Electron main).

---

## 6. CI/CD

| Workflow | Purpose |
|---|---|
| `ci.yml` | Lint, test, Knex migrate smoke on Docker Postgres |
| `desktop-smoke.yml` | macOS Electron + embedded PG launch |
| `release-mac.yml` | Sign, notarize, upload `.dmg` to GitHub Releases |
| `deploy-landing.yml` | Static landing only (Vercel/Pages) |

**Dev only:** `docker-compose.yml` with Postgres 16 + optional Redis — not required for end users.

---

## 7. Environment variables

**Local API:** `GRAPHSCOPE_DB_PROFILE=embedded|development|test`, `GRAPHSCOPE_API_PORT=47321`, `GRAPHSCOPE_DATA_DIR`, `GRAPHSCOPE_REDIS_URL` (optional)

**Landing:** `NEXT_PUBLIC_GITHUB_RELEASES_URL`, `NEXT_PUBLIC_DOWNLOAD_LATEST`

**CI release:** `APPLE_*`, `CSC_*`, `GH_TOKEN`

**Never on GraphScope servers:** there are none.

---

## 8. Production-ready (v1)

- [ ] Signed `.dmg` on GitHub Releases
- [ ] Landing page live with download link
- [ ] Product Hunt kit in `docs/producthunt/`
- [ ] Fresh Mac install: no Docker, no brew postgres, no account
- [ ] SSRF + workspace isolation tests green
- [ ] Knex migrations idempotent smoke in CI
- [ ] Portfolio demo script completes in < 8 minutes

---

## 9. Portfolio proof points (for hiring)

Before applying to backend/product-engineer roles, ship evidence of:

| Proof | Artifact |
|---|---|
| Knex migrations | `database/migrations/` with rollback tests |
| PostgreSQL queries | Repository PRs with EXPLAIN ANALYZE |
| Express + GraphQL | Working `/graphql` with 10+ operations |
| Apollo Client | Renderer fetching via hooks |
| Background jobs | graphile-worker tasks visible in UI job status |
| Analytics script | `scripts/analytics/` runnable via `pnpm analytics:rollup` |
| Query optimization | Document one before/after EXPLAIN in `docs/perf/` |
| Redis (optional) | Cache hit metrics in dev when Redis enabled |

---

## Document history

| Version | Notes |
|---|---|
| 1.0.0 | Cloud microservices plan |
| 1.1.0 | Desktop + Docker sidecar |
| 1.2.0 | Local-only, SQLite, no ORM |
| 1.4.0 | **PostgreSQL + Knex + Express + Apollo + graphile-worker** |
