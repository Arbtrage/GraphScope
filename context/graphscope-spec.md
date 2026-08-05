# GraphScope — Spec Context

## 2026-08-05 — Toddle-aligned stack, still local-first (v1.4)

- **Stack:** Express, Apollo Server, Apollo Client, **PostgreSQL** (embedded), **Knex**, **graphile-worker**
- **Optional:** local Redis cache
- **Unchanged:** zero GraphScope servers, landing page only deploy, Apache 2.0 OSS
- **ADR-0010:** PostgreSQL + Knex + Express stack (supersedes ADR-0007 SQLite/no ORM)
- **UI:** shadcn/ui + Tailwind + GraphScope tokens ([06-design-system.md](../spec/06-design-system.md), ADR-0011)

## 2026-08-05 — Open source Postman for GraphQL (v1.3)

- **Positioning:** **Open source (Apache 2.0) Postman for GraphQL** — daily use: collections, envs, history, execute
- **Free:** no GraphScope account, no subscription, no paywalled core features
- **Download:** GitHub Releases `.dmg` or build from source
- **ADR-0009:** open source + Postman-class daily use

## 2026-08-05 — Local-only zero servers (v1.2)

- ADR 0006–0008; superseded data layer by v1.4

## 2026-08-05 — Desktop-first (v1.1)

- Electron Mac app
