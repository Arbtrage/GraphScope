# @graphscope/ui

Design tokens, shadcn primitives (`components/ui`), and presentational GraphScope kits (`components/graphscope`).

**Allowed dependents:** `@graphscope/web`, `@graphscope/landing`.

Keep kits Apollo-free; orchestration lives in `apps/web/src/features`.

## Landing bundle note

Landing currently depends on `@graphscope/ui` for `Button` / `ThemeProvider` only. Measure the production landing JS payload before splitting into `@graphscope/ui-primitives`; a separate package is optional and only justified if Voyager/feature kits inflate the landing bundle.
