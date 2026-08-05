# GraphScope — Design System (Phase 2c)

| Field | Value |
|---|---|
| Document | UI / Design System |
| Status | Approved for implementation |
| Version | 1.0.0 |
| Last updated | 2026-08-05 |
| Applies to | `apps/web`, `packages/ui`, Electron renderer |
| Related | [02-system-design.md](./02-system-design.md), [03-feature-breakdown.md](./03-feature-breakdown.md) M0 |

---

## 1. Recommendation (locked for v1)

| Approach | Verdict | Why |
|---|---|---|
| **Fully custom design system** | ❌ No | 8–12+ weeks before first feature UI; wrong tradeoff for solo OSS ship |
| **Material UI / Ant Design** | ❌ No | Wrong aesthetic for Postman-class dev tools; heavy bundle |
| **shadcn/ui + Tailwind + custom tokens** | ✅ **Yes** | Accessible Radix primitives, code you own, fast Postman-like shells, portfolio-quality polish |
| **Copy shadcn defaults unchanged** | ❌ No | Looks generic; weak Product Hunt / hiring signal |

**Decision:** Build on **shadcn/ui** as the component foundation. Apply a **GraphScope token layer** (colors, typography, spacing, motion) and **custom domain components** for GraphQL-specific UI. Primitives come from shadcn; product identity and layout come from us.

---

## 2. Stack

| Layer | Choice |
|---|---|
| Styling | **Tailwind CSS 3.4+** |
| Components | **shadcn/ui** (Radix UI + copy-into-repo) |
| Icons | **lucide-react** |
| Theme | **next-themes** + CSS variables (`class` strategy) |
| Forms | **react-hook-form** + **zod** + shadcn `Form` |
| Command palette | shadcn **Command** (`cmdk`) — ⌘K search |
| Toasts | **sonner** |
| Code / GraphQL editor | **Monaco Editor** or **CodeMirror 6** (not shadcn — domain) |
| Graph viz | **react-voyager** / custom canvas (lazy-loaded) |
| Font (UI) | **Geist Sans** or **Inter** |
| Font (code) | **JetBrains Mono** |

---

## 3. Package layout

```text
packages/ui/
  src/
    components/
      ui/              # shadcn primitives (Button, Dialog, Sidebar, …)
      graphscope/      # product composites (see §6)
    hooks/
      use-mobile.ts
    lib/
      utils.ts         # cn()
    styles/
      globals.css      # CSS variables — source of truth for tokens
  components.json      # shadcn CLI config
  tailwind.config.ts   # extends tokens; content paths for apps/web
```

`apps/web` imports from `@graphscope/ui`. **Do not** duplicate shadcn components in `apps/web`.

---

## 4. Design tokens

Define in `packages/ui/src/styles/globals.css`. Tailwind maps to these variables in `tailwind.config.ts`.

### 4.1 Color — 60-30-10

GraphScope is a **developer tool** (Postman-class). **Dark mode is the default**; light mode supported.

| Role | ~% | Dark (default) | Light |
|---|---|---|---|
| **Neutral / surface** | 60% | `hsl(222 47% 6%)` background, `hsl(217 33% 12%)` cards | `hsl(0 0% 100%)`, `hsl(210 20% 98%)` |
| **Primary / brand** | 30% | GraphScope violet `hsl(262 83% 58%)` | Same hue, adjusted lightness |
| **Accent / CTA** | 10% | Teal accent `hsl(173 80% 40%)` for execute/run actions | Same |

**Semantic colors** (shadcn defaults, tuned):

- `destructive` — errors, breaking schema changes
- `warning` — lint findings, deprecations
- `success` — passing checks, 2xx execute
- `muted` — secondary labels, timestamps

Use shadcn semantic slots: `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--ring`, `--sidebar-*`.

### 4.2 Spacing — 8px grid

| Token | Value | Use |
|---|---|---|
| `space-1` | 4px | Tight icon padding only |
| `space-2` | 8px | Inline gaps |
| `space-4` | 16px | Card padding, form gaps |
| `space-6` | 24px | Section padding |
| `space-8` | 32px | Panel gaps |
| `space-12` | 48px | Page rhythm |

No arbitrary spacing (e.g. 13px) outside tokens.

### 4.3 Typography — 1.25 scale

| Token | Size | Use |
|---|---|---|
| `text-xs` | 12px | Badges, meta |
| `text-sm` | 14px | Secondary UI, table cells |
| `text-base` | 16px | Body |
| `text-lg` | 18px | Panel titles |
| `text-xl` | 20px | Section headers |
| `text-2xl` | 24px | Page titles |

- UI: `font-sans` (Geist/Inter)
- GraphQL, JSON, paths: `font-mono` (JetBrains Mono)

### 4.4 Radius & elevation

| Token | Value |
|---|---|
| `--radius` | `0.5rem` (8px) — buttons, inputs |
| `rounded-lg` | Cards, dialogs |
| `shadow-sm` | Raised panels |
| `shadow-md` | Modals, popovers |

### 4.4 Motion

- Micro-interactions: **150–200ms** `ease-out`
- Panel slide: **250ms**
- Respect `prefers-reduced-motion` — disable decorative transitions

### 4.5 Z-index scale

| Layer | z-index |
|---|---|
| sidebar | 10 |
| sticky header | 20 |
| dropdown / popover | 30 |
| modal / dialog | 40 |
| toast (sonner) | 50 |
| command palette | 50 |
| tooltip | 60 |

---

## 5. Interaction states (required)

Every interactive shadcn component must define all five states:

1. **Default**
2. **Hover**
3. **Active / pressed**
4. **Focus-visible** (keyboard ring — never remove)
5. **Disabled**

Custom composites inherit from primitives; do not skip focus rings on custom buttons.

---

## 6. Component tiers

### Tier A — shadcn primitives (install via CLI, minimal edits)

Install in M0; customize only via CSS variables:

| Component | GraphScope use |
|---|---|
| `Button` | Primary actions, run query |
| `Sidebar` | App shell navigation (Postman-like) |
| `Dialog` / `Sheet` | Settings, create collection |
| `DropdownMenu` | Workspace switcher, env picker |
| `Tabs` | Runner: Query / Variables / Headers |
| `Command` | ⌘K global search |
| `Table` | Operations list, history |
| `Input`, `Textarea`, `Select` | Forms, env vars |
| `Badge` | Op status, schema version tags |
| `Tooltip` | Icon buttons |
| `ScrollArea` | Long operation lists |
| `Separator` | Panel dividers |
| `Skeleton` | Loading states |
| `Toast` (sonner) | Job complete, execute errors |
| `Form` | Settings, create project |

### Tier B — GraphScope composites (custom, built from Tier A)

| Component | Description |
|---|---|
| `AppShell` | Sidebar + top bar + main + optional right panel |
| `WorkspaceSwitcher` | Dropdown + create workspace |
| `CollectionTree` | Nested folders + operations (Postman collections) |
| `EnvironmentPicker` | Env badge + quick switch |
| `OperationRunner` | Editor + variables JSON + headers + response panel |
| `ResponsePanel` | JSON tree, timing, errors, copy |
| `SchemaDiffView` | Side-by-side breaking change display |
| `JobStatusBadge` | graphile-worker job state |
| `EmptyState` | Illustration + CTA per page |
| `PageHeader` | Title + actions slot |

### Tier C — Domain / heavy (custom, lazy-loaded)

| Component | Notes |
|---|---|
| `GraphQLEditor` | Monaco/CodeMirror with GraphQL syntax + validation |
| `SchemaGraph` | Voyager embed — separate chunk |
| `VariablesEditor` | JSON editor with schema hints |

**Rule:** Tier A = shadcn. Tier B = our product UX. Tier C = specialized libs.

---

## 7. App shell (Postman parity)

```text
┌─────────────────────────────────────────────────────────────┐
│ TopBar: WorkspaceSwitcher │ EnvPicker │ ⌘K │ Settings      │
├──────────┬──────────────────────────────────┬───────────────┤
│ Sidebar  │  Main (OperationRunner / List)   │ Right panel   │
│          │                                  │ (optional:    │
│ Projects │                                  │  schema, AI)  │
│ Collect. │                                  │               │
│ History  │                                  │               │
│ Search   │                                  │               │
└──────────┴──────────────────────────────────┴───────────────┘
```

- Sidebar: shadcn `Sidebar` with collapsible sections
- Resizable panels: `react-resizable-panels` (optional M5+)
- Minimum window width: **1024px** (document in desktop)

---

## 8. Accessibility

- WCAG **2.1 AA** target for all Tier A/B components
- Contrast ≥ 4.5:1 text; ≥ 3:1 large text
- Touch targets ≥ **44×44px** where clickable
- ⌘K command palette fully keyboard navigable
- Semantic landmarks: `nav`, `main`, `aside`
- Screen reader labels on icon-only buttons (`aria-label`)

Radix (via shadcn) handles most focus trapping in dialogs; verify in desktop smoke tests.

---

## 9. Theming

```typescript
// apps/web/app/providers.tsx
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
  {children}
</ThemeProvider>
```

- **Default:** dark (developer tool convention)
- **Settings:** light / dark / system toggle
- Persist preference in local PostgreSQL or `localStorage` (non-secret)

Brand customization lives in **CSS variables only** — never fork shadcn component source for color changes.

---

## 10. shadcn CLI setup (M0)

```bash
cd packages/ui
pnpm dlx shadcn@latest init
# style: default, base color: slate, css variables: yes
pnpm dlx shadcn@latest add button sidebar dialog command table form input select tabs badge tooltip scroll-area separator skeleton dropdown-menu sheet sonner
```

`components.json` aliases:

```json
{
  "tailwind": { "config": "tailwind.config.ts", "css": "src/styles/globals.css" },
  "aliases": { "components": "@/components", "utils": "@/lib/utils" }
}
```

---

## 11. What we do NOT build custom

| Item | Use instead |
|---|---|
| Buttons, inputs, dialogs | shadcn |
| Focus management in modals | Radix |
| Data table sorting UI | shadcn Table + TanStack Table (M3+) |
| Dark mode plumbing | next-themes |
| Icon set | lucide-react |

---

## 12. Milestone mapping

| Milestone | Design system work |
|---|---|
| **M0** | Tailwind + shadcn init, tokens in `globals.css`, `AppShell` stub, dark default |
| **M1** | Login page, `WorkspaceSwitcher`, empty states |
| **M2** | Project list, schema diff (`SchemaDiffView`), Form patterns |
| **M4** | `OperationRunner`, `ResponsePanel`, `CollectionTree`, history Table |
| **M5** | ⌘K Command palette, search results UI |
| **M6** | Analytics dashboard cards, findings Badge variants |
| **M9** | Screenshot polish pass, motion audit, a11y spot-check |

---

## 13. Quality gates (CI / release)

- [ ] No hardcoded hex colors in `apps/web` — use CSS variables or Tailwind semantic classes
- [ ] All Tier B composites have Storybook stories (optional M9) or screenshot in `docs/images/desktop/`
- [ ] Light + dark screenshots for landing page
- [ ] Focus visible on primary flows (login, run query, ⌘K)
- [ ] `prefers-reduced-motion` respected

---

## 14. Portfolio note

Using **shadcn + intentional tokens** signals:

- You ship **accessible, modern React UI** without reinventing primitives
- You apply **product-level layout** (Postman shell) and **domain components** (GraphQL runner)
- You understand **when to customize vs compose** — valued in product engineer interviews

---

## Document history

| Version | Date | Notes |
|---|---|---|
| 1.0.0 | 2026-08-05 | Initial — shadcn foundation + GraphScope token layer |
