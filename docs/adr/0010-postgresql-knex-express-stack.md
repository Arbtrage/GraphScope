# ADR-0010 — PostgreSQL + Knex + Express + GraphQL Stack (Local)

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-08-05 |
| Deciders | GraphScope architecture |
| Supersedes | [ADR-0007](./0007-local-sql-no-orm.md) (SQLite + raw SQL, no ORM) |
| Related | [ADR-0006](./0006-zero-hosted-infrastructure.md), [ADR-0008](./0008-local-monolith-api.md) |

## Context

v1 remains **local-first** with **zero GraphScope-hosted servers** ([ADR-0006](./0006-zero-hosted-infrastructure.md)). The implementation stack is aligned with **production SaaS backend patterns** (Node.js, Express, GraphQL, PostgreSQL, Knex) so the project demonstrates the same skills used at product-engineering roles — without requiring cloud infrastructure.

Prior v1.2 chose SQLite + raw SQL + NestJS. That diverged from common team stacks and underweighted PostgreSQL query work, Knex migrations, and Express middleware patterns.

## Options

| Option | Pros | Cons |
|---|---|---|
| SQLite + raw SQL + NestJS (v1.2) | Zero install; simple file DB | Weak PostgreSQL/Knex/Express signal |
| **Embedded PostgreSQL + Knex + Express** | Real Postgres dialect; Knex migrations; Express + Apollo; bundled via `embedded-postgres` | Larger app bundle; PG process lifecycle |
| Cloud PostgreSQL (Neon/RDS) | Managed ops | Violates zero-server constraint |
| Prisma ORM | Fast scaffolding | Not target stack; hides SQL |

## Decision

### Runtime stack (must-have alignment)

| Layer | Choice |
|---|---|
| Runtime | **Node.js 20 LTS** |
| HTTP | **Express 4** |
| GraphQL server | **Apollo Server 4** (`expressMiddleware`) |
| GraphQL client | **Apollo Client 3** (Next.js renderer) |
| Database | **PostgreSQL 16** (embedded local instance) |
| Migrations & queries | **Knex 3** (migrations + query builder; repositories use Knex, not an ORM) |
| Job queue | **graphile-worker** (PostgreSQL-backed workers) |
| Search | **PostgreSQL full-text search** (`tsvector` + GIN) |
| Cache (optional) | **Redis 7** via `ioredis` when `GRAPHSCOPE_REDIS_URL` set locally |

### Local PostgreSQL (no cloud, no user install)

- Electron main spawns **embedded PostgreSQL** (`embedded-postgres` npm) on first launch
- Data directory: `~/Library/Application Support/GraphScope/data/pg/`
- Port: ephemeral loopback (e.g. `127.0.0.1:47322`) — not exposed to LAN
- **Dev/CI:** Docker Compose `postgres:16-alpine` service OR same embedded driver
- Knex migrations in `database/migrations/` — **single PostgreSQL dialect** (no SQLite/MySQL fork)

### Express modular monolith

- Replace NestJS with **Express** modular routers under `apps/api/src/`
- Modules: `workspace`, `auth`, `catalog`, `parser`, `execution`, `analytics`, `ai`, `search`, `jobs`
- GraphQL schema + resolvers in `apps/api/src/graphql/`
- Binds **`127.0.0.1:47321` only**

### Background jobs

- **graphile-worker** polls PostgreSQL job table (same DB)
- Job types: `parse.repo`, `schema.check`, `analytics.rollup`, `search.reindex`
- Demonstrates queue/worker patterns without AWS SQS or cloud Redis

### Optional local Redis

- When user runs local Redis (`brew services start redis`), app uses it for:
  - Hot SDL cache
  - Session token cache
  - Rate-limit counters (dev)
- App **degrades gracefully** without Redis (Postgres-only path)

### Analytics & scripting

- `scripts/analytics/` — Node scripts using Knex for mart rollups and ad-hoc reports
- `scripts/migrate.ts` — Knex CLI wrapper
- Portfolio signal: query optimization, EXPLAIN ANALYZE, migration authoring

## Rationale

- **PostgreSQL + Knex:** Same data layer as most SaaS product backends; migrations reviewable in PRs
- **Express + GraphQL:** Direct alignment with common Node API stacks
- **Apollo Client:** Standard GraphQL client patterns in the renderer
- **graphile-worker:** Production-grade PG queue without hosted infra
- **Embedded PG:** Preserves zero-install desktop UX while using real Postgres
- **Optional Redis:** Covers cache/queue-adjacent skills without mandating cloud services

## Consequences

- ADR-0007 **superseded**
- ADR-0008 updated: NestJS → **Express**
- ADR-0002 partially revived: workspace isolation via **`workspace_id` FK + Knex query scoping**
- ADR-0004 search: PostgreSQL FTS replaces SQLite FTS5 / OpenSearch for v1
- App bundle size increases (~50–80 MB for embedded PG binary)
- CI runs migrations against Docker Postgres + embedded-postgres smoke
- Repository tests use Knex against ephemeral Postgres (testcontainers or embedded)

## Follow-ups

- `database/knexfile.ts` — dev, test, embedded profiles
- Document EXPLAIN workflow in [07-local-data-engineering.md](../spec/07-local-data-engineering.md)
- Portfolio checklist in [05-production-oss.md](../spec/05-production-oss.md) §2D
