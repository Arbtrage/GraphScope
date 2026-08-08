# GraphQL codegen (apps/web)

1. Export SDL from the API schema modules: `pnpm --filter @graphscope/web codegen`
2. Typed documents land in `src/graphql/generated/`

Prefer colocating operations under `src/graphql/` and importing the generated `gql` helper for new features.
