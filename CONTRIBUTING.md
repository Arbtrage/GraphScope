# Contributing to GraphScope

Thank you for contributing to GraphScope — the open source Postman for GraphQL.

## Prerequisites

- **Node.js 20+**
- **pnpm 9+**
- **macOS** (for desktop/Electron development)
- **Docker** (optional — for CI-style Postgres without embedded PG)

## Quick start (desktop)

```bash
git clone https://github.com/Arbtrage/GraphScope.git
cd GraphScope
pnpm install
cp .env.example .env
# Optional: set GRAPHSCOPE_GITHUB_CLIENT_ID for GitHub Device Flow login
# Local sign-in works without GitHub — enter a display name on /login
pnpm desktop:dev
```

This starts:
1. Next.js renderer on `http://localhost:3000`
2. Electron — embedded PostgreSQL + local API on `127.0.0.1:47321`

## Quick start (API + web without Electron)

```bash
docker compose up -d
cp .env.example .env
pnpm stack:dev
```

API: `http://127.0.0.1:47321/graphql`  
Web: `http://localhost:3000`

## Scripts

| Command | Description |
|---|---|
| `pnpm desktop:dev` | Full desktop stack (Electron + web) |
| `pnpm stack:dev` | API + web (requires Docker Postgres) |
| `pnpm api:dev` | Express GraphQL API only |
| `pnpm web:dev` | Next.js renderer only |
| `pnpm db:migrate` | Run Knex migrations |
| `pnpm demo:reset` | Reset demo workspace seed data |
| `pnpm test` | Run all tests |
| `pnpm typecheck` | TypeScript check all packages |

## Environment variables

See [.env.example](.env.example).

| Variable | Description |
|---|---|
| `GRAPHSCOPE_API_PORT` | Local API port (default `47321`) |
| `GRAPHSCOPE_DB_PROFILE` | `embedded` \| `development` \| `test` |
| `GRAPHSCOPE_GITHUB_CLIENT_ID` | Optional — GitHub OAuth App client ID for Device Flow |

Create a GitHub OAuth App (no callback URL needed for Device Flow): https://github.com/settings/developers

## Project structure

```text
apps/desktop   Electron main (embedded PG, API spawn, Keychain)
apps/web       Next.js + Apollo Client
apps/landing   Marketing site (hero + download CTA)
apps/api       Express + Apollo Server
packages/ui    shadcn/ui + GraphScope design tokens
packages/db    Knex + repositories
database/      Knex migrations + seeds
fixtures/      Golden repos for parser recall tests
```

## Phase 3 (M8–M9)

Phase 3 adds hardening and ship basics:

- **Jobs dashboard** — `jobs` GraphQL query + `/app/jobs` UI for background tasks
- **Parser golden fixtures** — `fixtures/repos/minimal` + recall tests
- **Composition check** — local SDL merge validation (`composition-check.ts`)
- **Demo seed** — `pnpm demo:reset` for a sample workspace, project, schema, and environment
- **Landing + release** — `apps/landing`, electron-builder config, macOS release/smoke workflows
- **OSS docs** — LICENSE (Apache-2.0), SECURITY.md, CODE_OF_CONDUCT.md, Product Hunt kit stub

Run `pnpm demo:reset` after migrations to populate demo data. Landing dev server: `pnpm --filter @graphscope/landing dev` (port 3001).

## Phase 4 (v1.1 features)

- **Optional Redis** — set `GRAPHSCOPE_REDIS_URL` for AI explain caching; status in Settings
- **Composition** — `workspaceComposition(projectId)` GraphQL + project overview badge
- **Analytics polish** — findings on operation detail, latency chart, rich demo seed
- **Jobs retry** — `retryJob` mutation + `/app/jobs` UI
- **Notifications** — macOS Notification Center (desktop) + optional Slack webhook in Settings
- **CI schema gate** — `pnpm schema:check:ci -- old.graphql new.graphql` emits GitHub Actions annotations

Example GitHub Actions step:

```yaml
- run: pnpm schema:check:ci -- schemas/old.graphql schemas/new.graphql
```

## Pull requests

1. Branch from `main`
2. Run `pnpm typecheck && pnpm test`
3. Include test plan in PR description

## License

Apache 2.0 — see [LICENSE](LICENSE).
