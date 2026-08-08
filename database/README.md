# Database ownership

Migrations and seeds live in this directory (`database/migrations`, `database/seeds`).

[`packages/db`](../packages/db) is the only runtime consumer: Knex resolves migrations via a relative path to `database/migrations` (see `packages/db/src/knex.ts`).

Do not add a second migrations tree under `packages/db`. Use `pnpm db:migrate` from the repo root.

Source of truth for Knex CLI config: [`knexfile.ts`](./knexfile.ts). Compiled `knexfile.js*` artifacts should not be committed.
