# ADR-0004 — Search Engine

| Field | Value |
|---|---|
| Status | Accepted (updated v1.4 — PostgreSQL FTS) |
| Date | 2026-08-05 |
| Related | [ADR-0010](./0010-postgresql-knex-express-stack.md) |

## Context

Original ADR chose OpenSearch for full-text search in a cloud deployment. v1.2 superseded with SQLite FTS5.

v1.4 uses **PostgreSQL native full-text search** — no OpenSearch, no Elasticsearch cluster, no cloud search service.

## Decision

- **`tsvector` + GIN indexes** on `core_operation`, schema type/field documents
- Maintained via Knex migrations + triggers or application-level reindex jobs
- `search.reindex` job type in graphile-worker
- Ranked search via `ts_rank`; prefix matching for ⌘K palette

## Rationale

- Same database engine as rest of app — no extra process for default users
- Demonstrates PostgreSQL query features (FTS, indexes) valued in backend roles
- Optional future: local Elasticsearch for advanced search (out of v1 scope)

## Consequences

- No OpenSearch / Elastic Cloud in v1
- Search quality sufficient for local workspace scale (10⁴–10⁶ documents)
