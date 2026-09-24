# GraphScope — Spec Context

## 2026-08-30 — Local GraphQL explorer for a codebase

Product for this cut: open a folder, trust the inventory, run an operation against a real URL, see a schema that came from that URL. Not Postman, not GraphOS.

- **Home is Operations.** Overview is gone from nav. After a successful scan, the overlay shows a report (operations · ignored · parse errors) then **Continue**.
- **API down ≠ scan failed.** Overlay copy splits “GraphScope API not reachable” from job `lastError`.
- **Environments** hold URL, headers, secrets (`{{NAME}}` on URL and headers only), and **Pull schema from this URL** (`introspectEnvironment`). Schema/Graph show `source: introspected` vs leftover inferred types.
- **Run drafts** persist in `localStorage` per operation. History restores the draft and opens the drawer; it does not auto-execute.
- Unused API modules (AI, collections, Voyager, `publishSchema` registry) stay uncalled. Do not surface them in nav or README.

## 2026-08-30 — Environments and Postman-style run settings

- **Environments** (sidebar, was Endpoints) are the editable place for name, GraphQL URL, production flag, and default headers. Create / save / delete persist via `createEnvironment` / `updateEnvironment` / `deleteEnvironment`.
- **Run drawer** is Postman-style: Query, Variables (JSON), request Headers. Request headers merge on top of environment headers. Query is sent as `adhocQuery`.
- **Run errors** must surface `TIMEOUT`, `TRANSPORT_ERROR` (server not reachable), `BLOCKED`, `GRAPHQL_ERROR`, and local API failures — not an empty `{}` body. Status chip is danger on failure; Errors tab opens automatically.

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
