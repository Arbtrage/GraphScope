# ADR-0004 — OpenSearch for Global Search

| Field | Value |
|---|---|
| Status | Superseded for v1 by SQLite FTS5 in [0007](./0007-local-sql-no-orm.md) |
| Date | 2026-08-05 |
| Deciders | GraphScope architecture |

## Context

Users need fast search across operations, types, fields, repositories, and collections within a workspace/org.

## Options

1. **PostgreSQL full-text (`tsvector`)** — fewer components
2. **Meilisearch** — great DX; less “enterprise” ops story
3. **OpenSearch** — relevance, filters, scale, ILM

## Decision

Use **OpenSearch** with asynchronous projections from PostgreSQL via outbox + BullMQ. PostgreSQL remains source of truth; search is rebuildable.

## Rationale

- Fits design capacity (millions of operations, type/field graph filters)
- Strong filter+relevance story for schema-centric UX
- Aligns with enterprise portfolio narrative
- Decouples query load from primary OLTP

## Consequences

- Additional operational component in Compose/Helm
- Index lag must be monitored (target < 30s for interactive UX)
- Local memory footprint needs documented limits

## Follow-ups

- Index Lifecycle Management for older docs
- Consider hybrid autocomplete via edge n-grams
