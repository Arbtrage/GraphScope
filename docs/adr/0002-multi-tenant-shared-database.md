# ADR-0002 — Workspace-Scoped PostgreSQL (Local)

| Field | Value |
|---|---|
| Status | Accepted (revived v1.4 — local scope) |
| Date | 2026-08-05 |
| Deciders | GraphScope architecture |
| Related | [ADR-0010](./0010-postgresql-knex-express-stack.md) |

## Context

Original ADR assumed cloud multi-tenant PostgreSQL with org/workspace hierarchy on a shared server. v1.2 superseded this for SQLite single-file storage.

v1.4 revives **workspace-scoped relational modeling** on **local embedded PostgreSQL** — same isolation patterns as SaaS backends, without hosted infrastructure.

## Decision

- Single local PostgreSQL database per app install
- All tenant-scoped tables include **`workspace_id` FK**
- Knex repositories **always filter by `workspace_id`** from session context
- CI **cross-workspace IDOR suite** required (workspace A cannot read workspace B)
- Indexes: composite `(workspace_id, …)` on hot paths

## Rationale

- Mirrors production SaaS data isolation patterns recruiters expect
- Enables portfolio narrative: migrations, scoped queries, EXPLAIN on real Postgres
- No cloud Postgres required — embedded instance on user's Mac

## Consequences

- Every list/detail resolver validates workspace membership
- Migration reviews must include workspace-scoped indexes
- Export/import operates on workspace slices
