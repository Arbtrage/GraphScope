# ADR-0005 — Desktop-first macOS

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-08-05 |

## Context

GraphScope v1 targets a shippable macOS desktop product (Postman-class daily use) before other platforms.

## Decision

- **Primary client:** macOS Electron app distributed via GitHub Releases `.dmg`
- **Renderer:** Next.js + Apollo Client inside Electron
- **Local API:** Express + Apollo Server on loopback ([ADR-0008](./0008-local-monolith-api.md))
- **Database:** Embedded PostgreSQL ([ADR-0010](./0010-postgresql-knex-express-stack.md))
- Windows/Linux deferred to v2+

## Consequences

- All milestones advance Mac desktop toward GA
- CI includes macOS Electron smoke tests
- Code signing + notarization required for release
