# ADR-0009 — Open Source (Apache 2.0) + Postman-Class Daily Use

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-08-05 |
| Deciders | GraphScope architecture |

## Context

GraphScope is a **public open source project** on GitHub. Users should install the Mac app and use it **every day like Postman** — collections, environments, history, execute — but **purpose-built for GraphQL** (schema registry, repo discovery, Voyager, checks, AI).

There is no commercial lock-in: no GraphScope account, no paid tier required for core features in v1.

## Decision

1. **License:** Apache License 2.0
2. **Distribution:** Source on GitHub; binaries via GitHub Releases (`.dmg`)
3. **Usage model:** Free forever for local desktop use; all core workspace features open source
4. **Postman parity target (GraphQL-native):** collections, environments, secrets, history, runner UI, search — plus GraphScope differentiators (discovery, registry, schema graph, checks)
5. **Community:** GitHub Issues, Discussions, CONTRIBUTING.md, good-first-issues, PR templates
6. **No freemium server:** v1 does not gate features behind cloud accounts because there is no cloud product

## Rationale

- OSS + local-first matches Postman/Insomnia adoption pattern without maintainer server costs
- Apache 2.0 is enterprise-friendly and standard for developer tools
- “Postman for GraphQL” is instantly understandable on Product Hunt and in README

## Consequences

- All core features must be usable without contacting GraphScope infrastructure
- Documentation must include “daily workflow” guides (install → first query → collections)
- Trademark: project name GraphScope; avoid implying official Postman/Apollo affiliation

## Follow-ups

- Optional Open Collective / GitHub Sponsors for maintainer support (non-blocking)
- Windows/Linux OSS builds in v2
