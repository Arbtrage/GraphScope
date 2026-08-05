# GraphScope

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-green.svg)](https://github.com/Arbtrage/GraphScope)

**The open source Postman for GraphQL — on your Mac, for free.**

GraphScope is a **local-first desktop workspace** for GraphQL teams and solo developers. Use it **daily like Postman**: collections, environments, secrets, history, and a request runner — plus GraphQL superpowers: repo discovery, schema registry, Voyager visualization, breaking-change checks, and schema-aware AI.

> **No GraphScope account. No subscription. No servers we operate.**  
> Download the `.dmg` from [GitHub Releases](https://github.com/Arbtrage/GraphScope/releases) or build from source.

## Use it like Postman

| You want to… | GraphScope |
|---|---|
| Save and organize requests | **Collections** |
| Switch dev / staging / prod | **Environments** |
| Store API tokens safely | **Keychain secrets** |
| Re-run past requests | **History** |
| Execute and inspect responses | **Operation runner** |
| Find anything fast | **⌘K search** |

## Plus GraphQL-only features Postman doesn't do well

- **Discover** operations automatically from your repos  
- **Register** schemas and catch **breaking changes**  
- **Explore** the graph with Voyager-style visualization  
- **Analyze** complexity and anti-patterns  
- **Ask AI** (your OpenAI key) with schema-aware context  

## Open source

- **License:** Apache 2.0 — free to use, fork, and contribute  
- **Code:** public on GitHub  
- **Releases:** signed macOS `.dmg` on GitHub Releases  
- **We host:** landing page only — everything else runs on your Mac  

## Quick start

1. Download `GraphScope-x.y.z.dmg` from [Releases](https://github.com/Arbtrage/GraphScope/releases)  
2. Open the app → embedded PostgreSQL starts automatically  
3. Add a repo or local folder → browse discovered operations  
4. Create an environment → run your first query  

### Development (Phase 1)

```bash
pnpm install
cp .env.example .env
pnpm desktop:dev    # Electron + embedded PG + API + web
# or
docker compose up -d && pnpm stack:dev   # Docker Postgres + API + web
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for full setup.

Or build from source — see [CONTRIBUTING.md](CONTRIBUTING.md).

## Specification

Engineering docs: **[docs/spec/README.md](docs/spec/README.md)**

## Stack (v1.4)

| Layer | Technology |
|---|---|
| Desktop | Electron + Next.js |
| UI | **shadcn/ui** + Tailwind + GraphScope tokens (`packages/ui`) |
| GraphQL client | **Apollo Client** |
| API | **Express** + **Apollo Server** (local loopback) |
| Database | **PostgreSQL 16** (embedded, local) |
| Migrations & SQL | **Knex** |
| Jobs | **graphile-worker** (PostgreSQL queue) |
| Search | PostgreSQL **full-text search** |
| Cache (optional) | Local **Redis** when configured |

**Not in v1:** cloud hosting, maintainer-operated API/DB, Docker required for end users.

## Portfolio narrative

GraphScope demonstrates production-grade **Node.js / Express / GraphQL / PostgreSQL / Knex** backend engineering in a shippable open-source desktop product — migrations, query optimization, background workers, and Apollo Client integration — without requiring cloud infrastructure.

## Contributing

Contributions welcome. GraphScope is designed as a **real OSS product**, not a spec-only repo.
