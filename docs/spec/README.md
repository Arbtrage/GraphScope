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
| 2b | [02-local-data-engineering.md](./02-local-data-engineering.md) |
| 3–5 | Milestones, implementation, launch |

**ADR-0009:** [Open source + Postman-class use](../adr/0009-open-source-apache-2.md)

---

## Locked defaults

| Decision | Choice |
|---|---|
| **Product type** | **Open source desktop app** (Apache 2.0) |
| **Daily UX** | **Postman-like** + GraphQL depth |
| **Servers** | None (landing page only) |
| **Download** | GitHub Releases |
| **Database** | SQLite, raw SQL, no ORM |

---

## Document control

| Version | Date | Notes |
|---|---|---|
| 1.3.0 | 2026-08-05 | Open source + Postman-class positioning |
