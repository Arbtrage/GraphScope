# GraphScope — Engineering Specification Index

**Product:** GraphScope — **open source Postman for GraphQL** (Mac desktop)  
**License:** Apache 2.0  
**Tagline:** *Ship GraphQL with confidence.*  
**Use:** Daily workspace — collections, envs, history, execute — like Postman, GraphQL-native  
**Cost:** Free — no GraphScope account; no maintainer servers  
**Download:** GitHub Releases `.dmg`

---

## Reading order

| Phase | Document |
|---|---|
| 1 | [01-prd.md](./01-prd.md) — OSS, Postman parity, Product Hunt |
| 2 | [02-system-design.md](./02-system-design.md) |
| 2b | [07-local-data-engineering.md](./07-local-data-engineering.md) — PostgreSQL + Knex |
| 2c | [06-design-system.md](./06-design-system.md) — shadcn/ui + GraphScope tokens |
| 3–5 | Milestones, implementation, launch |

**Stack ADR:** [0010 PostgreSQL + Knex + Express](../adr/0010-postgresql-knex-express-stack.md)  
**ADR-0009:** [Open source + Postman-class use](../adr/0009-open-source-apache-2.md)

---

## Locked defaults (v1.4)

| Decision | Choice |
|---|---|
| **Product type** | **Open source desktop app** (Apache 2.0) |
| **Daily UX** | **Postman-like** + GraphQL depth |
| **Servers** | None (landing page only) |
| **Download** | GitHub Releases |
| **API** | **Express** + Apollo Server on loopback |
| **Database** | **Embedded PostgreSQL** (local) |
| **Migrations & queries** | **Knex** |
| **GraphQL client** | **Apollo Client** |
| **Jobs** | **graphile-worker** (PG-backed) |
| **Search** | PostgreSQL FTS |
| **Cache** | Optional local Redis |
| **UI / design system** | **shadcn/ui** + Tailwind + GraphScope CSS tokens ([06-design-system.md](./06-design-system.md)) |

---

## Portfolio / hiring alignment

GraphScope v1.4 intentionally uses the same backend stack common at **product SaaS companies** while staying **local-first** (no cloud deploy required):

| Skill area | Where demonstrated |
|---|---|
| Node.js + Express | `apps/api` modular monolith |
| GraphQL | Apollo Server schema + resolvers; Apollo Client in renderer |
| PostgreSQL | Embedded PG; Knex migrations; EXPLAIN-driven query work |
| Knex | Migrations, seeds, repository queries |
| Background jobs | graphile-worker job types (parse, check, rollup, reindex) |
| Scripting / analytics | `scripts/analytics/` mart rollups via Knex |
| React + Apollo Client | `apps/web` data layer |
| Redis (optional) | SDL cache, session cache when `GRAPHSCOPE_REDIS_URL` set |
| Product mindset | PRD user stories, Postman parity, acceptance criteria |

See [05-production-oss.md](./05-production-oss.md) §2D for portfolio release checklist.

---

## Document control

| Version | Date | Notes |
|---|---|---|
| 1.4.0 | 2026-08-05 | PostgreSQL + Knex + Express + Apollo stack (local) |
| 1.3.0 | 2026-08-05 | Open source + Postman-class positioning |
| 1.2.0 | 2026-08-05 | Local-only (SQLite — superseded by 1.4) |
