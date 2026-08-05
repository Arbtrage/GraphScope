# Architecture Decision Records

ADRs capture significant, durable technical choices for GraphScope.

## Index

| ID | Title | Status |
|---|---|---|
| [0011](./0011-shadcn-design-system.md) | **shadcn/ui + GraphScope tokens** |
| [0010](./0010-postgresql-knex-express-stack.md) | **PostgreSQL + Knex + Express + GraphQL** |
| [0005](./0005-desktop-first-macos.md) | Desktop-first macOS |
| [0006](./0006-zero-hosted-infrastructure.md) | **Zero hosted infrastructure** |
| [0008](./0008-local-monolith-api.md) | Local Express monolith API |
| [0009](./0009-open-source-apache-2.md) | **Open source + Postman-class use** |
| [0002](./0002-multi-tenant-shared-database.md) | Workspace-scoped PostgreSQL (local) |
| [0003](./0003-ssrf-safe-execution-proxy.md) | SSRF-safe execution (still valid) |
| [0004](./0004-opensearch-for-search.md) | PostgreSQL full-text search |
| [0007](./0007-local-sql-no-orm.md) | SQLite + raw SQL (superseded by 0010) |
| [0001](./0001-apollo-federation.md) | Federation (superseded v1) |

## When to add an ADR

Add an ADR when a decision is expensive to reverse, affects multiple services, or chooses among meaningful alternatives (data stores, auth models, composition strategy, tenancy, security controls, **client platform**).

## Template

```markdown
# ADR-XXXX — Title

| Field | Value |
|---|---|
| Status | Proposed / Accepted / Superseded |
| Date | YYYY-MM-DD |

## Context
## Options
## Decision
## Rationale
## Consequences
## Follow-ups
```
