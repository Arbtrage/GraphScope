# GraphScope — Local Data Engineering Guide

| Field | Value |
|---|---|
| Document | Data model & SQL conventions (companion to Phase 2) |
| Version | 1.0.0 |
| Last updated | 2026-08-05 |
| ADRs | [0007](../adr/0007-local-sql-no-orm.md), [0006](../adr/0006-zero-hosted-infrastructure.md) |

Normative reference for **database design without an ORM**. Implement all persistence against this guide.

---

## 1. Principles

1. **SQL is the source of truth** — migrations are authoritative; no generated schema from code
2. **Explicit over implicit** — name constraints, indexes, and columns in migrations
3. **Layered zones** — `stg_` → `core_` → `mart_`; never skip staging for bulk parser writes
4. **Append-only audit** — `audit_event` has no UPDATE/DELETE in application code
5. **Parameterized queries only** — no string concatenation of user input
6. **Portable SQL** — default SQLite; MySQL folder mirrors logic with dialect notes

---

## 2. Repository layout

```text
database/
  migrations/
    sqlite/
      V001__init_core.sql
      V002__staging_parser.sql
      V003__mart_analytics.sql
      ...
    mysql/
      V001__init_core.sql
      ...                          # parallel numbering, dialect-adjusted
  seeds/
    sqlite/
      dev_seed.sql
  docs/
    DATA_DICTIONARY.md             # column-level definitions
    ERD.md                           # Mermaid ER diagrams
  scripts/
    migrate.ts                       # applies pending migrations
    rollback.ts                      # dev only; documented per migration
packages/
  db/
    src/
      connection.ts                  # SQLite / MySQL factory
      migrate.ts
      repositories/
        core/
        stg/
        mart/
        audit/
      queries/                       # .sql files optional (sql-tag loader)
```

---

## 3. Core entities (representative DDL sketch)

> Full migrations are implementation artifacts; this defines the logical model.

### 3.1 `core_workspace`

Local app supports multiple workspaces on one machine (like Postman).

```sql
CREATE TABLE core_workspace (
  workspace_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 3.2 `core_project`

```sql
CREATE TABLE core_project (
  project_id     INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id   INTEGER NOT NULL REFERENCES core_workspace(workspace_id),
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (workspace_id, slug)
);
CREATE INDEX idx_core_project_workspace ON core_project(workspace_id);
```

### 3.3 `core_schema_version` (SCD Type 2)

```sql
CREATE TABLE core_schema_version (
  schema_version_id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id        INTEGER NOT NULL REFERENCES core_project(project_id),
  content_hash      TEXT NOT NULL,
  sdl_path          TEXT NOT NULL,          -- file under Application Support
  git_sha           TEXT,
  valid_from        TEXT NOT NULL DEFAULT (datetime('now')),
  valid_to          TEXT,                   -- NULL = current
  is_current        INTEGER NOT NULL DEFAULT 1 CHECK (is_current IN (0,1)),
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_schema_version_project_current
  ON core_schema_version(project_id, is_current);
CREATE UNIQUE INDEX uq_schema_version_hash
  ON core_schema_version(project_id, content_hash);
```

### 3.4 `stg_parse_result` → `core_operation`

Parser writes staging rows; promotion job moves to core.

```sql
CREATE TABLE stg_parse_result (
  stg_id           INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id           INTEGER NOT NULL,
  repo_path        TEXT NOT NULL,
  file_path        TEXT NOT NULL,
  content_hash     TEXT NOT NULL,
  operation_type   TEXT NOT NULL CHECK (operation_type IN ('QUERY','MUTATION','SUBSCRIPTION')),
  operation_name   TEXT,
  raw_content      TEXT NOT NULL,
  confidence       REAL NOT NULL,
  parsed_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE core_operation (
  operation_id     INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id       INTEGER NOT NULL REFERENCES core_project(project_id),
  content_hash     TEXT NOT NULL,
  operation_type   TEXT NOT NULL,
  operation_name   TEXT,
  content          TEXT NOT NULL,
  depth            INTEGER,
  complexity       INTEGER,
  confidence       REAL NOT NULL,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (project_id, content_hash)
);
```

### 3.5 `core_job` (replaces BullMQ)

```sql
CREATE TABLE core_job (
  job_id       INTEGER PRIMARY KEY AUTOINCREMENT,
  job_type     TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','running','completed','failed','dead')),
  attempts     INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_at TEXT NOT NULL DEFAULT (datetime('now')),
  started_at   TEXT,
  finished_at  TEXT,
  last_error   TEXT
);
CREATE INDEX idx_core_job_poll ON core_job(status, scheduled_at);
```

### 3.6 `mart_workspace_daily` (analytics rollup)

```sql
CREATE TABLE mart_workspace_daily (
  workspace_id   INTEGER NOT NULL,
  metric_date    TEXT NOT NULL,
  operation_cnt  INTEGER NOT NULL DEFAULT 0,
  exec_p50_ms    REAL,
  exec_p95_ms    REAL,
  findings_high  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (workspace_id, metric_date)
);
```

### 3.7 `audit_event` (append-only)

```sql
CREATE TABLE audit_event (
  audit_id       INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id   INTEGER,
  action         TEXT NOT NULL,
  resource_type  TEXT,
  resource_id    TEXT,
  metadata_json  TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_audit_workspace_time ON audit_event(workspace_id, created_at DESC);
```

---

## 4. Search (FTS5)

```sql
CREATE VIRTUAL TABLE search_operation_fts USING fts5(
  operation_name,
  content,
  repo_path,
  content='core_operation',
  content_rowid='operation_id'
);
```

Triggers maintain FTS on insert/update to `core_operation`.

---

## 5. Migration rules

| Rule | Detail |
|---|---|
| Naming | `V{NNN}__{snake_description}.sql` |
| Idempotency | Use `IF NOT EXISTS` where SQLite allows |
| Rollback | Each migration header comment documents rollback SQL |
| Review | PR must include EXPLAIN for new hot-path queries |
| MySQL parity | Same version number in `mysql/` folder before release |

---

## 6. Application Support file layout

```text
~/Library/Application Support/GraphScope/
  data/
    graphscope.db              # SQLite default
  schemas/
    {project_id}/
      {content_hash}.graphql
  repos/                       # optional local git mirrors
    {project_id}/
  logs/
    graphscope.log
  config.json                  # non-secret preferences
```

Secrets (GitHub PAT, OpenAI key, env tokens) → **macOS Keychain only**, never in SQLite.

---

## 7. Optional local MySQL mode

Settings → Database → Engine: `sqlite` (default) | `mysql`

MySQL connection: `127.0.0.1:3306`, database `graphscope`, user-created schema. App runs `database/migrations/mysql/` on first connect. Same repository interfaces; `packages/db/src/dialect/` switches driver.

---

## 8. Testing

- Unit: repositories against `:memory:` SQLite
- Migration: apply all migrations on empty DB; apply twice (idempotency smoke)
- Contract: seed golden data; assert query result snapshots for key reports
