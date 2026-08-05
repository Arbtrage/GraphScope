# ADR-0007 — Local SQL Database, No ORM

| Field | Value |
|---|---|
| Status | **Superseded** by [ADR-0010](./0010-postgresql-knex-express-stack.md) |
| Date | 2026-08-05 |
| Supersedes | ADR-0002 (Postgres multi-tenant), Prisma, PostgreSQL as v1 store |

## Context

v1.2 chose SQLite embedded + raw SQL repositories with no ORM.

## Decision (historical)

1. Default engine: SQLite 3 via `better-sqlite3`
2. Optional local MySQL 8+
3. No ORM — parameterized SQL only
4. Versioned SQL migrations in `database/migrations/{sqlite,mysql}/`

## Superseded by ADR-0010

v1.4 adopts **embedded PostgreSQL + Knex** (query builder + migrations). Knex replaces hand-written migration files while keeping explicit SQL visibility in migration modules and raw `.sql` where needed.

See [ADR-0010](./0010-postgresql-knex-express-stack.md).
