# ADR-0011 — shadcn/ui Foundation + GraphScope Token Layer

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-08-05 |
| Related | [06-design-system.md](../spec/06-design-system.md) |

## Context

GraphScope needs a Postman-class desktop UI with accessible components, dark-mode dev-tool aesthetic, and portfolio-quality polish — without spending months on a custom design system.

## Options

| Option | Pros | Cons |
|---|---|---|
| Fully custom DS | Unique brand | Too slow for solo v1 |
| Material / Ant Design | Complete | Wrong look; heavy |
| **shadcn/ui + custom tokens** | Fast, accessible, code ownership | Requires token discipline |
| shadcn defaults only | Fastest | Generic; weak PH signal |

## Decision

- **Foundation:** shadcn/ui (Radix + Tailwind) in `packages/ui`
- **Customization:** GraphScope CSS variables (violet primary, teal execute accent, dark default)
- **Custom composites:** Tier B components (`AppShell`, `OperationRunner`, etc.) built from shadcn primitives
- **Domain editors:** Monaco/CodeMirror — not shadcn

## Consequences

- M0 includes shadcn init + token setup
- No hardcoded colors in `apps/web`
- Landing page reuses tokens for brand consistency
