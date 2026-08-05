# ADR-0008 — Local Modular Monolith API (Federation Deferred)

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-08-05 |
| Deciders | GraphScope architecture |
| Related | Supersedes ADR-0001 for **v1**; Federation remains v2+ if team server returns |

## Context

Prior spec used NestJS microservices + Apollo Federation. v1 is a single-user local desktop app with no maintainer servers — Federation and eight deployables are unnecessary operational weight.

## Decision

- **Single process:** `apps/api` — NestJS **modular monolith** with one GraphQL schema (Apollo Server, not Federation gateway)
- **Spawned by Electron main** on loopback `127.0.0.1:47321` (fixed port, configurable)
- **Modules mirror prior bounded contexts** (identity, catalog, parser, execution, analytics, ai, search) as Nest modules, not separate deployables
- **ADR-0001 Federation** deferred to v2 optional team/cloud server

## Rationale

- One process to start/stop with the app — no Docker, no compose
- Preserves domain module boundaries for future extraction
- Simpler debugging for solo development and PH users

## Consequences

- Single GraphQL endpoint for renderer and CLI
- Shared SQLite connection pool in process
- Integration tests run against one app instance
