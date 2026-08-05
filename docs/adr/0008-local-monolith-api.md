# ADR-0008 — Local Modular Monolith API (Federation Deferred)

| Field | Value |
|---|---|
| Status | Accepted (updated v1.4) |
| Date | 2026-08-05 |
| Deciders | GraphScope architecture |
| Related | [ADR-0010](./0010-postgresql-knex-express-stack.md); Supersedes ADR-0001 for **v1** |

## Context

Prior spec used NestJS microservices + Apollo Federation. v1 is a single-user local desktop app with no maintainer servers — Federation and multiple deployables are unnecessary.

v1.4 aligns the monolith with **Express + Apollo Server** (see ADR-0010).

## Decision

- **Single process:** `apps/api` — **Express modular monolith** with one GraphQL schema (Apollo Server 4, not Federation gateway)
- **Spawned by Electron main** on loopback `127.0.0.1:47321` (fixed port, configurable)
- **Modules** as Express route groups + GraphQL resolvers: workspace, auth, catalog, parser, execution, analytics, ai, search, jobs
- **ADR-0001 Federation** deferred to v2 optional team/cloud server

## Rationale

- One process to start/stop with the app — no Docker, no compose required for end users
- Express middleware stack matches common SaaS backend patterns
- Preserves domain module boundaries for future extraction
- Simpler debugging for solo development and Product Hunt users

## Consequences

- Single GraphQL endpoint for renderer (Apollo Client) and CLI
- Shared Knex connection pool in process
- graphile-worker runs in same process or sibling worker thread
- Integration tests run against one Express app instance
