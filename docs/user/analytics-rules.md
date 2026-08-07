# Analytics rules (GS001–GS007)

GraphScope runs static analysis on discovered GraphQL operations. Findings appear on operation detail pages and roll up to the workspace analytics dashboard.

| Rule | Severity | What it detects |
|------|----------|-----------------|
| GS001_UNBOUNDED_LIST | HIGH | List fields without pagination arguments (`first`, `limit`, etc.) |
| GS002_DEPTH_LIMIT | HIGH | Query depth exceeds 12 levels |
| GS003_INTROSPECTION_QUERY | HIGH | `__schema` / `__type` introspection in operation |
| GS004_HIGH_COMPLEXITY | HIGH | Estimated complexity exceeds 1000 |
| GS005_FRAGMENT_OVERLOAD | MEDIUM | More than 10 fragment spreads |
| GS006_ALIAS_OVERLOAD | LOW | More than 5 field aliases |
| GS007_MULTIPLE_OPERATIONS | MEDIUM | Multiple operations in one document |

Findings are recomputed after repository parse and after executing a saved operation. Run `pnpm analytics:rollup` to refresh workspace daily metrics.
