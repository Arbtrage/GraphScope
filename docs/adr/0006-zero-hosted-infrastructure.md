# ADR-0006 — Zero Hosted Infrastructure (Local-Only v1)

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-08-05 |
| Deciders | GraphScope architecture |
| Supersedes | Cloud SaaS, Docker Compose sidecar, K8s/Helm v1 paths |

## Context

GraphScope v1 targets a **Product Hunt launch** and open-source distribution via **GitHub Releases (`.dmg`)**. The maintainer will **not operate any GraphScope servers** — no API host, no database host, no webhook relay, no auth backend. The only maintainer-deployed surface is a **static marketing/landing page**.

## Options

1. **Cloud SaaS + desktop client** — requires ongoing server ops
2. **Desktop + Docker Compose sidecar** — still heavy; Docker prerequisite hurts PH conversion
3. **Fully local desktop** — embedded API + embedded DB; user’s machine is the entire stack
4. **Local desktop + optional self-hosted team server** — defer team server to v2+

## Decision

Adopt **fully local v1** (option 3):

- All application logic runs on the user’s Mac inside GraphScope.app
- **No network dependency** on GraphScope-owned infrastructure (except optional user-initiated calls: GitHub API, OpenAI, target GraphQL endpoints)
- **Distribution:** signed `.dmg` on GitHub Releases; landing page links to GitHub download
- **Maintainer deploys:** `apps/landing` static site only (Vercel / Cloudflare Pages / GitHub Pages)

## Rationale

- Zero server cost and zero ops burden for solo maintainer
- Privacy story for Product Hunt (“your data never leaves your machine”)
- Aligns with Postman/Insomnia local-first mental model
- GitHub Releases + OSS is credible portfolio distribution

## Consequences

- No GraphScope GitHub App webhooks → use **local git clone + user GitHub PAT/device token** for repo sync
- No multi-device sync in v1 → single-machine **embedded PostgreSQL** database
- Auth is **GitHub Device Flow** or **PAT in Keychain** — no OAuth server callback
- Microservices, Federation gateway, **cloud** Redis, BullMQ, OpenSearch **removed from v1**
- **Local stack:** Express + Apollo Server, Knex, graphile-worker, optional local Redis ([ADR-0010](./0010-postgresql-knex-express-stack.md))
- Single **modular monolith API** (`apps/api`) spawned by Electron main on `127.0.0.1`

## Follow-ups

- v2 optional: team sync server, cloud backup — explicitly out of v1
- Landing page: Product Hunt assets, demo GIF, GitHub download CTA
