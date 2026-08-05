# ADR-0007 — Local SQL Database, No ORM

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-08-05 |
| Deciders | GraphScope architecture |
| Supersedes | ADR-0002 (Postgres multi-tenant), Prisma, PostgreSQL as v1 store |

## Context

v1 is local-only with no maintainer servers. The user requested **local database** (MySQL-class), **no ORM**, and modeling aligned with **data engineering practices** (explicit DDL, layered schemas, auditability).

## Options

| Option | Pros | Cons |
|---|---|---|
| PostgreSQL + Prisma | Familiar from prior spec | ORM banned; separate server process |
| **SQLite embedded** | Zero install; single file; ships in `.dmg`; FTS5 built-in | Not MySQL dialect |
| Local MySQL/MariaDB required | MySQL exact | User must install/configure DB — bad PH funnel |
| SQLite default + optional MySQL | Best PH UX + power-user choice | Two dialect maintenance |

## Decision

1. **Default engine: SQLite 3** (embedded via `better-sqlite3`) — file at  
   `~/Library/Application Support/GraphScope/data/graphscope.db`
2. **Optional engine: local MySQL 8+ / MariaDB 10.6+** — user configures host/socket in Settings; same logical model, dialect-specific migration folders
3. **No ORM** — parameterized SQL only (`better-sqlite3` / `mysql2`); repository layer per bounded context
4. **Schema management** — versioned SQL migrations in `database/migrations/{sqlite,mysql}/`
5. **Modeling** — layered data zones per data engineering practice (see § below)

### Layered schema zones

| Zone | Prefix | Purpose |
|---|---|---|
| **Core** | `core_` | System of record: projects, operations, schema versions, environments |
| **Staging** | `stg_` | Raw parser output, import buffers, job payloads before promotion |
| **Mart** | `mart_` | Analytics rollups, dashboards, pre-aggregated metrics |
| **Audit** | `audit_` | Append-only event log (immutable) |

Rules:

- Surrogate keys (`INTEGER`/`BIGINT` autoincrement or UUID text in SQLite)
- Natural keys documented in `database/docs/DATA_DICTIONARY.md`
- **SCD Type 2** for `core_schema_version` (valid_from, valid_to, is_current)
- Foreign keys enforced in SQLite (`PRAGMA foreign_keys = ON`)
- Indexes defined in same migration as table creation
- No `SELECT *` in production code paths; explicit column lists in repositories

## Rationale

- SQLite: zero dependency for Product Hunt downloads — open app and go
- No ORM: full control over queries, indexes, and EXPLAIN plans; portfolio signal for data engineering
- Optional MySQL: honors user preference for MySQL tooling without blocking default UX
- Layered tables: clean separation for parse pipelines and analytics (staging → core → mart)

## Consequences

- ADR-0004 OpenSearch → **SQLite FTS5** (+ optional `core_search_document` table) for v1
- SDL blobs stored as **files** under Application Support, paths in `core_schema_version.sdl_path`
- Job queue → **`core_job`** table + in-process worker loop (no Redis/BullMQ)
- Repository tests use in-memory SQLite (`:memory:`)

## Follow-ups

- `database/docs/DATA_DICTIONARY.md` — column-level documentation
- Migration lint: forbid destructive changes without ADR in CI
