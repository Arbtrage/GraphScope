# GraphScope — Local Data Engineering Guide

| Field | Value |
|---|---|
| Document | Data model & Knex conventions (companion to Phase 2) |
| Version | 1.4.0 |
| Last updated | 2026-08-05 |
| ADRs | [0010](../adr/0010-postgresql-knex-express-stack.md), [0002](../adr/0002-multi-tenant-shared-database.md) |

Normative reference for **PostgreSQL + Knex** persistence. Implement all data access against this guide.

---

## 1. Principles

1. **Knex migrations are authoritative** — versioned in `database/migrations/`; no schema drift from code
2. **Explicit over implicit** — name constraints, indexes, and columns in migrations
3. **Layered zones** — `stg_` → `core_` → `mart_`; never skip staging for bulk parser writes
4. **Append-only audit** — `audit_event` has no UPDATE/DELETE in application code
5. **Parameterized queries only** — Knex bindings; no string concatenation of user input
6. **Workspace scoping** — every tenant table has `workspace_id`; every query filters it
7. **Query review** — PRs for hot paths include `EXPLAIN ANALYZE` output

---

## 2. Repository layout

```text
database/
  knexfile.ts                    # dev, test, embedded profiles
  migrations/
    20250805120000_init_core.ts
    20250805120100_staging_parser.ts
    20250805120200_mart_analytics.ts
    ...
  seeds/
    dev_seed.ts
  docs/
    DATA_DICTIONARY.md
    ERD.md
scripts/
  migrate.ts                     # knex migrate:latest wrapper
  analytics/
    rollup_workspace_daily.ts    # mart job script
packages/
  db/
    src/
      knex.ts                    # Knex singleton
      repositories/
        core/
        stg/
        mart/
        audit/
```

---

## 3. Knex migration example

```typescript
// database/migrations/20250805120000_init_core.ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('core_workspace', (t) => {
    t.bigIncrements('workspace_id').primary();
    t.text('name').notNullable();
    t.text('slug').notNullable().unique();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('core_job', (t) => {
    t.bigIncrements('job_id').primary();
    t.bigInteger('workspace_id').notNullable()
      .references('workspace_id').inTable('core_workspace');
    t.text('job_type').notNullable();
    t.text('status').notNullable().defaultTo('pending');
    t.jsonb('payload').notNullable().defaultTo('{}');
    t.timestamps(true, true);
    t.index(['workspace_id', 'status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('core_job');
  await knex.schema.dropTableIfExists('core_workspace');
}
```

---

## 4. Core entities (representative)

> Full migrations are implementation artifacts; this defines the logical model.

### 4.1 `core_workspace`

Local app supports multiple workspaces on one machine (like Postman).

### 4.2 `core_project`

GraphQL project linked to a repo path or GitHub URL; scoped by `workspace_id`.

### 4.3 `core_operation`

Discovered or saved GraphQL operations; dedupe by `(project_id, content_hash)`.

### 4.4 `core_schema_version`

SCD Type 2 schema versions; SDL stored on disk, path in row.

### 4.5 `stg_parse_result`

Bulk parser output before promotion to `core_operation`.

### 4.6 `mart_workspace_daily`

Analytics rollup — populated by `scripts/analytics/rollup_workspace_daily.ts`.

### 4.7 `audit_event`

Append-only audit log.

---

## 5. PostgreSQL full-text search

```typescript
// Migration: add tsvector + GIN index
await knex.raw(`
  ALTER TABLE core_operation
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(operation_name, '') || ' ' || coalesce(source_path, ''))
  ) STORED;
`);
await knex.raw(`
  CREATE INDEX idx_core_operation_fts ON core_operation USING GIN (search_vector);
`);
```

Repository search:

```typescript
const rows = await knex('core_operation')
  .where('workspace_id', workspaceId)
  .whereRaw("search_vector @@ plainto_tsquery('english', ?)", [query])
  .orderByRaw("ts_rank(search_vector, plainto_tsquery('english', ?)) DESC", [query])
  .limit(50);
```

---

## 6. graphile-worker integration

- Worker uses same Knex/PostgreSQL connection as API
- Task handlers in `apps/api/src/jobs/tasks/`
- Enqueue from resolvers via `addJob('parse.repo', payload)`

Job types:

| Task | Purpose |
|---|---|
| `parse.repo` | Clone/parse → stg → core |
| `schema.check` | GraphQL Inspector breaking changes |
| `analytics.rollup` | Refresh mart tables |
| `search.reindex` | Rebuild FTS vectors |

---

## 7. Migration rules

| Rule | Detail |
|---|---|
| Naming | Knex timestamp prefix + snake description |
| Idempotency | CI runs `migrate:latest` twice |
| Rollback | Every migration implements `down()` |
| Review | PR must include EXPLAIN for new hot-path queries |
| Indexes | Composite `(workspace_id, …)` on list endpoints |

---

## 8. Application Support file layout

```text
~/Library/Application Support/GraphScope/
  data/
    pg/                          # embedded PostgreSQL data directory
  schemas/
    {project_id}/
      {content_hash}.graphql
  repos/
    {project_id}/
  logs/
    graphscope.log
  config.json
```

Secrets (GitHub PAT, OpenAI key, env tokens) → **macOS Keychain only**, never in PostgreSQL.

---

## 9. Dev & CI database profiles

| Profile | Connection |
|---|---|
| `embedded` | `embedded-postgres` on ephemeral port (desktop app) |
| `development` | Docker Compose `postgres:16-alpine` |
| `test` | testcontainers PostgreSQL or ephemeral embedded |

`knexfile.ts` selects profile via `GRAPHSCOPE_DB_PROFILE`.

---

## 10. Optional local Redis

When `GRAPHSCOPE_REDIS_URL=redis://127.0.0.1:6379`:

- Cache hot SDL by `schema_version_id`
- Cache session lookups (TTL 15m)
- Rate-limit counters (dev)

Repositories fall back to PostgreSQL-only reads when Redis unavailable.

---

## 11. Testing

- Unit: repositories against test Postgres (testcontainers)
- Migration: `knex migrate:latest` on empty DB; run twice
- Contract: seed golden data; assert query snapshots for mart rollups
- Isolation: cross-workspace IDOR tests required in CI

---

## Document history

| Version | Notes |
|---|---|
| 1.0.0 | SQLite + raw SQL |
| 1.4.0 | **PostgreSQL + Knex + graphile-worker + PG FTS** |
