# ADR-0001 — Apollo Federation for the Platform GraphQL API

| Field | Value |
|---|---|
| Status | Superseded for v1 by [0008](./0008-local-monolith-api.md) |
| Date | 2026-08-05 |
| Note | Federation retained as v2 cloud team-server reference |
| Deciders | GraphScope architecture |

## Context

GraphScope exposes a rich GraphQL API across identity, catalog, discovery, execution, analytics, AI, search, and notifications. We needed a composition model for multiple NestJS services.

## Options

1. **Modular monolith** — single deployable schema
2. **Schema stitching BFF**
3. **Apollo Federation v2 gateway + subgraphs**

## Decision

Adopt **Apollo Federation v2** with a dedicated `gateway` and subgraph-per-bounded-context.

## Rationale

- Industry-standard approach aligned with portfolio targets (Apollo, Postman-class platforms)
- Clear entity ownership (`User`, `Project`, `OperationDocument`, …)
- Independent deployability and scaling per subdomain
- Composition checks become a first-class CI artifact

## Consequences

- Higher Day-1 complexity than a monolith
- Requires supergraph composition in CI and gateway config distribution
- Local DX depends on Docker Compose running multiple services

## Follow-ups

- Pin `@apollo/gateway` / composition libraries; revisit Rover workflows in M8
- Hot-reload supergraph from registry (P1)
