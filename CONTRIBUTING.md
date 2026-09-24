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
1. Vite renderer (preferred `http://127.0.0.1:5173`, falls back if busy)
2. Electron — embedded PostgreSQL (preferred `55432`) + local API (preferred `47321`)
3. Knex migrations run automatically when the API boots — no separate `db:migrate` for desktop

Ports are written to `{GRAPHSCOPE_DATA_DIR}/runtime.json`. If a preferred port is occupied, the next free port nearby is used and passed to API + renderer.

## Quick start (API + web without Electron)

Requires an external Postgres on `127.0.0.1:5432` (Docker Compose is optional):

```bash
docker compose up -d   # optional — or use Homebrew Postgres with user/db graphscope
cp .env.example .env
pnpm db:migrate
pnpm stack:dev
```

API: `http://127.0.0.1:47321/graphql`  
Web: `http://localhost:5173`

## Scripts

| Command | Description |
|---|---|
| `pnpm desktop:dev` | Full desktop stack (Electron + embedded PG + web) |
| `pnpm --filter @graphscope/desktop package:mac` | Build unsigned macOS `.dmg` (after package builds) |
| `pnpm stack:dev` | API + web (requires external Postgres on 5432) |
| `pnpm api:dev` | Express GraphQL API only |
| `pnpm web:dev` | Vite renderer only |
| `pnpm db:migrate` | Run Knex migrations (stack:dev / external PG only) |
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

### Shipping a macOS release

1. Build packages, then package:  
   `pnpm --filter @graphscope/config --filter @graphscope/shared-types --filter @graphscope/schema-tools --filter @graphscope/db --filter @graphscope/api --filter @graphscope/ui --filter @graphscope/web --filter @graphscope/desktop build`  
   `pnpm --filter @graphscope/desktop package:mac`
2. Or push a `v*` tag — [`.github/workflows/release-mac.yml`](.github/workflows/release-mac.yml) builds an unsigned `.dmg` + zip and attaches them to the GitHub Release.
3. Gatekeeper: right-click → Open, or `xattr -cr /Applications/GraphScope.app`. Apple signing/notarization is optional follow-up when secrets exist.

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
