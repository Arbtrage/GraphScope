# GraphScope

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-green.svg)](https://github.com/Arbtrage/GraphScope)

**A local GraphQL explorer for a codebase.**

Open a folder. GraphScope scans it for `.graphql` files and embedded operations, then lets you run them against a real endpoint — with environments, secrets, an introspected schema, and history. Everything stays on your Mac.

> **No GraphScope account. No subscription. No servers we operate.**  
> Download a macOS `.dmg` from [GitHub Releases](https://github.com/Arbtrage/GraphScope/releases), or build from source below.

## Install (macOS)

1. Download the latest `.dmg` from [Releases](https://github.com/Arbtrage/GraphScope/releases) (tag `v*`).
2. Open the DMG and drag **GraphScope** to Applications.
3. First launch: right-click → **Open** (unsigned builds are blocked by Gatekeeper until you approve once).  
   If macOS still quarantines the app: `xattr -cr /Applications/GraphScope.app`

Apple signing/notarization is a follow-up — builds from CI are unsigned on purpose for this cut.

## What it does

| You want to… | GraphScope |
|---|---|
| Find the GraphQL already in a repo | **Open folder → scan** |
| Switch dev / staging / prod | **Environments** |
| Store API tokens safely | **Secrets** (`{{NAME}}` in URL and headers) |
| Execute and inspect responses | **Run drawer** |
| See the live schema | **Pull schema from a URL** |
| Re-open a past run | **History** (restores the last draft) |
| Find anything fast | **⌘K search** |

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm desktop:dev    # Electron + embedded PG + API + Vite (auto-migrates; no Docker)
# or (contributor path — external Postgres on 5432)
docker compose up -d && pnpm db:migrate && pnpm stack:dev
```

Then: **Open folder** → wait for the scan report → **Continue** into Operations → add an environment URL → run a query.

See [CONTRIBUTING.md](CONTRIBUTING.md) for full setup.

### Demo data

```bash
pnpm demo:reset
```

Seeds a demo workspace with sample operations and executions.

## Open source

- **License:** Apache 2.0 — free to use, fork, and contribute
- **Code:** public on GitHub
- **We host:** landing page only — the explorer runs on your Mac

## Specification

Engineering docs: **[docs/spec/README.md](docs/spec/README.md)**

## Stack

| Layer | Technology |
|---|---|
| Desktop | Electron + Vite |
| UI | React + Tailwind |
| API | Express + GraphQL (local loopback) |
| Database | PostgreSQL (embedded, local) |
| Migrations & SQL | Knex |
| Jobs | graphile-worker (PostgreSQL queue) |
| Search | PostgreSQL full-text search |

**Not in this cut:** cloud hosting, Apple notarization, collections, AI, Voyager, or a public schema registry.

## Contributing

Contributions welcome. GraphScope is designed as a **real OSS product**, not a spec-only repo.
