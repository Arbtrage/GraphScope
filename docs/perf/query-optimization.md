# Query optimization

GraphScope stores execution history and search metadata in PostgreSQL. Use `EXPLAIN (ANALYZE, BUFFERS)` when tuning slow workspace queries.

## Search FTS — before index

Workspace-scoped full-text search on `core_search_document` without a GIN index forces sequential scans:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT entity_id, kind, title,
       ts_rank(search_vector, plainto_tsquery('english', 'hello')) AS score
FROM core_search_document
WHERE workspace_id = 1
  AND search_vector @@ plainto_tsquery('english', 'hello')
ORDER BY score DESC
LIMIT 20;
```

Typical result on a 10k-row table: `Seq Scan on core_search_document` with high buffer reads.

## Search FTS — after GIN index (migration `20250807030000_search_fts`)

The migration adds `search_vector tsvector` with:

```sql
CREATE INDEX core_search_document_fts_idx
  ON core_search_document USING GIN (search_vector);
CREATE INDEX core_search_document_workspace_idx
  ON core_search_document (workspace_id);
```

Re-run the same query: PostgreSQL uses `Bitmap Index Scan` on the GIN index, then filters by `workspace_id`. Latency drops from tens of ms to sub-ms on dev datasets.

## Operations list by workspace

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT operation_id, name, operation_type
FROM core_operation
WHERE workspace_id = 1
ORDER BY updated_at DESC
LIMIT 50;
```

Ensure `(workspace_id, updated_at DESC)` or `(workspace_id, project_id)` indexes exist for discovery views — see `core_operation` indexes in migration `20250806040000_discovery`.
