# ADR-0005 — Desktop-First Client (macOS v1)

| Field | Value |
|---|---|
| Status | Accepted (updated v1.2) |
| Date | 2026-08-05 |
| Deciders | GraphScope architecture |
| Related | [0006](./0006-zero-hosted-infrastructure.md), [0007](./0007-local-sql-no-orm.md), [0008](./0008-local-monolith-api.md) |

## Context

GraphScope v1 targets Product Hunt and GitHub Releases. Engineers expect a native Mac app like Postman/Insomnia — not a browser tab or a product that requires the maker to run servers.

## Decision

- **Electron + Next.js renderer** (`apps/desktop` + `apps/web`)
- **macOS first** — signed `.dmg` on GitHub Releases
- **Local API** spawned by Electron main ([ADR-0008](./0008-local-monolith-api.md)) — **no Docker sidecar**
- **SQLite** embedded ([ADR-0007](./0007-local-sql-no-orm.md))
- **GitHub Device Flow** or PAT — no GraphScope OAuth server
- **Maintainer deploy:** static landing page only

## Consequences

- No Docker prerequisite for users
- Apple signing + notarization in CI
- Product Hunt story: local privacy + OSS + direct download

## Follow-ups

- Windows/Linux desktop in v2
- Optional cloud sync in v2 (explicitly not v1)
