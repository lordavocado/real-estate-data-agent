# AGENTS.md

## Quick start

```bash
pnpm install:all      # root + web dependencies
cp .env.example .env.local
# Fill in OPENAI_API_KEY, RESIGHTS_API_TOKEN, RESIGHTS_API_DOMAIN
pnpm dev:all          # eve (port 2000) + web UI (port 3001)
```

Open http://localhost:3001 for the chat frontend. The eve HTTP API runs on
http://localhost:2000 in dev — the web app talks to it via a same-origin proxy at
`/api/eve/*` (defined in `web/app/api/eve/[...path]/route.ts`) so no CORS
configuration is needed in dev.

If the UI fails after a crash: `rm -rf web/.next "$(node -p "require('path').join(require('os').tmpdir(),'resights-web-next')")" && pnpm dev:all`
(or restart — `predev:all` auto-removes corrupted caches and stale eve snapshots).

If you only want the agent and the built-in eve tooling, the legacy
`pnpm dev` (just `eve dev`) still works.

## Tech stack

- **Backend:** [eve](https://eve.dev) v0.12 — filesystem-first AI agent framework
- **Model:** OpenAI `gpt-5.5` via `@ai-sdk/openai` 4.x
- **Frontend:** Next.js 15 (App Router) + React 19 + Tailwind v4
  - **AI SDK client pattern:** `useEveAgent` from `eve/react` (eve's hook
    projects server events to AI-SDK-compatible `UIMessage[]` parts[]).
  - **AI Elements (Vercel):** Official chat primitives under `web/components/ai-elements/*`
    installed from the [AI SDK Elements registry](https://elements.ai-sdk.dev):
    `Conversation`, `Message`, `Reasoning`, `Tool`, `ChainOfThought`, `Queue`,
    `PromptInput`, `Shimmer`, etc.
  - **Eve adapters:** `web/components/chat/*` wires eve `parts[]` to AI Elements:
    - `assistant-turn.tsx` — reasoning → tool workflow → answer
    - `tool-workflow.tsx` — Chain of Thought + Queue for tool steps
    - `inline-artifact.tsx` — charts/tables/cards/maps inline per step
    - `ask-question-prompt.tsx` — `ask_question` HITL
  - **Inline artifacts:** `present_chart`, `present_table`, `present_card`, and
    `present_map` render inside the chat via Recharts, Leaflet/OSM, and shadcn-style
    components under `web/components/canvas/*`.
- **Charts:** Recharts 2.x
- **Maps:** Leaflet 1.9 (imperative API in `leaflet-map.tsx`; avoids react-leaflet
  Strict Mode re-init issues) + OpenStreetMap tiles
- **Icons:** lucide-react
- **Animations:** motion (via AI Elements `Shimmer`)

- **Runtime:** Node.js 24+, TypeScript 5.7.3, ES2022 target, ESNext modules, bundler resolution, strict mode
- **Package manager:** pnpm
- **Schema validation:** Zod v4
- **API connection:** 4.8MB OpenAPI 3.1 spec (`agent/connections/resights-openapi.json`) — autogenerates tools at runtime; `lib/fix_openapi_spec.ts` normalizes invalid `examples` fields at load time

## Scaffolded directory layout

```
agent/                 # eve framework files (see existing sections below)
  agent.ts, instructions.md, channels/, connections/, tools/, skills/
  sandbox.ts           # justbash() backend

lib/                   # shared utilities
  resights.ts          # convenience fetch wrapper (not used by agent tools)
  fix_openapi_spec.ts  # OpenAPI spec normalizer

web/                   # Next.js 15 frontend
  app/
    layout.tsx                          # html shell, theme tokens, viewport
    page.tsx                            # single-column chat workspace
    globals.css                         # Tailwind v4 + design tokens + shimmer
    api/eve/[...path]/route.ts          # same-origin proxy to eve NDJSON stream
  components/
    ai-elements/                        # Vercel AI Elements (conversation, reasoning, tool, queue, …)
    chat/                               # eve → AI Elements adapters + inline artifacts
    canvas/                             # chart/card/table/map renderers (used inline)
    ui/                                 # shadcn/ui primitives
    chat-panel.tsx                      # main chat shell
  hooks/
    use-eve-chat.ts                     # wraps useEveAgent
    use-eve-chat-status.ts              # small status-string predicates
  lib/
    utils.ts                            # cn(), formatters
    chat-types.ts                       # narrow types over EveMessagePart
    artifacts.ts                        # classify + parse tool outputs
    parse-message-parts.ts              # flatten assistant turn parts
    tool-labels.ts                      # human-readable tool step labels
  package.json, tsconfig.json, next.config.ts, postcss.config.mjs, components.json
```

## Conventions

### Agent-side (existing)

- **Snake_case filenames** for all `.ts`/.`.md` files under `agent/` and `lib/`
  (not kebab-case or PascalCase).
- **Every module file has a single default export** — `defineAgent`, `defineChannel`, `defineOpenAPIConnection`, `defineTool`.
- Tools use `defineTool()` from `eve/tools` with Zod v4 schemas (`z.object({...})`).
- See `agent/tools/calculate_cap_rate.ts` for the canonical tool pattern.

### Web-side (new)

- React files use **PascalCase** for components (`ChatPanel.tsx`,
  `ArtifactChart.tsx`) and **kebab-case** for routes (`page.tsx`,
  `route.ts`, `globals.css`) — these are Next.js conventions.
- Components are **client components** (`"use client"` at the top) unless they
  have no hooks/event handlers/state, in which case they can be server-only.
- Tailwind v4 + CSS variables defined in `app/globals.css` (`@theme inline`
  block) — extend the design system there, do not hard-code colors.
- Install AI Elements: `cd web && pnpm dlx shadcn@latest add "https://elements.ai-sdk.dev/api/registry/<name>.json"`.
  Eve-specific UI belongs in `components/chat/` and should compose AI Elements
  rather than reimplementing them.

## Design System

> See [`DESIGN.md`](./DESIGN.md) for the full spec. Summary below for agents.

This UI follows **Vercel's design language** — achromatic canvas, shadow-as-border,
Geist typography, and blue (`#0072F5`) as the sole interactive accent.

### Color palette

| Token | Value | Role |
|-------|-------|------|
| Page canvas | `#FAFAFA` | `bg-background` |
| Elevated surface | `#FFFFFF` | `bg-card` |
| Recessed / hover | `#F2F2F2` / `#EBEBEB` | `bg-muted` / `hover:bg-accent` |
| Text primary | `#171717` | `text-foreground` |
| Text secondary | `#4D4D4D` | `text-secondary-foreground` |
| Text muted | `#8F8F8F` | `text-muted-foreground` |
| Interactive blue | `#0072F5` | links, `text-primary`, focus rings |
| Input focus | `#005FCC` | native input outline |
| Status colors | see DESIGN.md §2 | **10px dots only** — never large fills |

### Tailwind semantic mappings (via `@theme inline` in `globals.css`)

| Tailwind class | Light value |
|----------------|-------------|
| `bg-background` | `#FAFAFA` |
| `bg-card` | `#FFFFFF` |
| `text-foreground` | `#171717` |
| `text-muted-foreground` | `#8F8F8F` |
| `text-primary` / links | `#0072F5` |
| `ring-ring` | `#0072F5` |

### Typography

- **Font:** Geist Sans (400/500/600 only — never 700)
- **Mono:** Geist Mono (500 for code)
- **Body / buttons / labels:** 14px / weight 400 / 1.43 line-height
- **Display (`h1`):** 48px / weight 600 / tracking `-2.28px`
- **Section titles (`h3`):** 32px / weight 600 / tracking `-1.28px`

### Border radius

| Context | Value | Tailwind |
|---------|-------|----------|
| Default components | 6px | `rounded-md` |
| Cards, panels | 12px | `rounded-lg` |
| Pills, badges | 9999px | `rounded-full` |

### Component rules

- **Containers:** use `shadow-border` (not CSS `border`) — `box-shadow: 0 0 0 1px rgba(0,0,0,0.08)`
- **Ghost button:** transparent default, `hover:bg-accent` (`#EBEBEB`), text promotes to `#171717`
- **Primary / links:** `#0072F5` for interactive text and filled primary actions
- **Focus:** double-ring `0 0 0 2px #FFF, 0 0 0 4px #0072F5` via `focus-ring-vercel` or `ring-ring`
- **Cards:** `bg-card shadow-border rounded-lg` (12px radius)
- **Header separator:** `shadow-header-bottom` instead of `border-b`
- **Dropdowns / popovers:** `shadow-border-menu`

### Do's and Don'ts

**DO:**
- Use shadow-as-border for container boundaries (`shadow-border`, `shadow-border-medium`)
- Use `#0072F5` for links, focus rings, and interactive accents
- Use Geist weights 400/500/600 only; semibold (600) reserved for display headings
- Use 6px radius on inputs/buttons, 12px on cards
- Use spacing multiples of 4px (8, 12, 16, 24, 32, 48)

**DON'T:**
- Do not use CSS `border` on cards/containers — use box-shadow instead
- Do not use font-weight 700 or decorative gradients
- Do not use chromatic colors except blue (interactive) and status dots (~10px)
- Do not animate buttons with transform/opacity — color changes only
- Do not use divider lines — separate with spacing and surface color

### Environment

- `.env.example` is the template; `.env.local` is the actual file
  (gitignored). Eve loads it automatically.
- For the frontend optionally set `EVE_BASE_URL=http://localhost:2000`
  in `web/.env.local` if your eve lives somewhere other than localhost.

## Frontend dev workflow

```bash
pnpm dev:web   # just the Next.js app on http://localhost:3001
pnpm dev:all   # eve (:2000) + Next.js (:3001) together
pnpm typecheck # runs web tsc --noEmit
pnpm build:web # next build
pnpm smoke     # E2E chat smoke test (needs dev:all running)
```

The web app expects eve running on `:2000` (or wherever `EVE_BASE_URL`
points). The proxy at `/api/eve/*` strips CORS so the browser talks to the
same origin throughout.

## Key quirks

- **Sandbox:** Uses `justbash()` (no Docker/microsandbox). Built-in shell/file tools
  (`bash`, `read_file`, `write_file`, `glob`, `grep`) are disabled stubs — this agent
  only needs Resights API tools + calculators + `present_*` tools.
- The agent discovers API endpoints at runtime via `connection_search`. The
  `agent/connections/resights.ts` connection whitelists ~170 operations from
  28 API domains. Adding a new operation requires adding its operationId
  to the `operations.allow` array.
- `lib/resights.ts` is a separate convenience wrapper around raw `fetch`;
  not used by the agent's own tool calling — the agent uses the OpenAPI
  connection tools.
- Zod v4 — ensure `zod` v4 API is used throughout.
- The Leaflet map uses imperative `L.map()` in `leaflet-map.tsx` (not
  `react-leaflet` `MapContainer`) to avoid "Map container is already initialized"
  errors under React Strict Mode and streaming re-renders.
- Charts, tables, cards, and maps render inline beneath each `present_*` step
  inside the tool workflow — there is no separate canvas pane.

## No CI, no tests, no eslint

There are no test, lint, or CI scripts. `pnpm dev:all` is the day-to-day
command. `pnpm typecheck` runs `tsc --noEmit` against the web workspace as a
smoke check. `scripts/e2e-api-test.mjs` exercises live Resights API calls when
credentials are configured.
