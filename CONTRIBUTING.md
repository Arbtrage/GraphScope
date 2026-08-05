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
apps/api       Express + Apollo Server
packages/ui    shadcn/ui + GraphScope design tokens
packages/db    Knex + repositories
database/      Knex migrations
```

## Pull requests

1. Branch from `main`
2. Run `pnpm typecheck && pnpm test`
3. Include test plan in PR description

## License

Apache 2.0 — see [LICENSE](LICENSE) (to be added at GA).
