# ADR-0002 — Multi-Tenant Shared PostgreSQL with org_id Isolation

| Field | Value |
|---|---|
| Status | Superseded for v1 by [0007](./0007-local-sql-no-orm.md) |
| Date | 2026-08-05 |
| Deciders | GraphScope architecture |

## Context

GraphScope is multi-tenant B2B SaaS. We must isolate tenant data while keeping early delivery feasible.

## Options

1. **Database-per-tenant** — strongest isolation; heavy ops
2. **Schema-per-tenant** — medium isolation; migrations painful
3. **Shared tables + `org_id` on every row** — standard SaaS pattern
4. **Shared DB now, extract later** using outbox-ready boundaries

## Decision

Use a **single PostgreSQL cluster and shared schema** with mandatory `org_id` columns, application-level enforcement, and CI IDOR tests. Design service boundaries and outbox events so **database-per-service** extraction remains possible.

Postgres RLS may be added as defense-in-depth after MVP.

## Rationale

- Fastest path to correct product features
- Avoids distributed transactions across services early
- Matches common Stripe/Atlassian-style tenancy at early scale
- Isolation bugs become detectable via automated suites

## Consequences

- A bug omitting `org_id` filters is a SEV-0 risk — mitigated by guards, lint/review checklist, and tests
- Noisy neighbors share DB resources — mitigate with pooling, indexes, eventual partitioning of `executions`

## Follow-ups

- Evaluate RLS in hardening sprint
- Partition/archive `executions` when approaching tens of millions of rows
