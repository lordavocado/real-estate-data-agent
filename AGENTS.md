# AGENTS.md

## Quick start

```bash
pnpm install          # pnpm, not npm
cp .env.example .env.local
# Fill in OPENAI_API_KEY, RESIGHTS_API_TOKEN, RESIGHTS_API_DOMAIN
pnpm dev:all          # runs eve (port 3000) AND the web UI (port 3001) together
```

Open http://localhost:3001 for the chat frontend. The eve HTTP API runs on
http://localhost:3000 — the web app talks to it via a same-origin proxy at
`/api/eve/*` (defined in `web/app/api/eve/[...path]/route.ts`) so no CORS
configuration is needed in dev.

If you only want the agent and the built-in eve tooling, the legacy
`pnpm dev` (just `eve dev`) still works.

## Tech stack

- **Backend:** [eve](https://eve.dev) v0.12 — filesystem-first AI agent framework
- **Model:** OpenAI `gpt-5.5` via `@ai-sdk/openai` 4.x
- **Frontend:** Next.js 15 (App Router) + React 19 + Tailwind v4
  - **AI SDK client pattern:** `useEveAgent` from `eve/react` (eve's hook
    projects server events to AI-SDK-compatible `UIMessage[]` parts[]).
  - **Custom AI-Elements-style components** under `web/components/chat/*`
    modelled after Vercel's `<Conversation>`, `<Message>`, `<Reasoning>`,
    `<Shimmer>`, `<PromptInput>`.
  - **Canvas artifacts:** `web/components/canvas/*` renders `present_chart`
    (Recharts), `present_card`, `present_table`, and `present_map`
    (Leaflet/OSM) right-pane within a live artifact view.
- **Charts:** Recharts 2.x
- **Maps:** Leaflet 1.9 + react-leaflet 4.x (OpenStreetMap tiles)
- **Icons:** lucide-react
- **Animations:** framer-motion

- **Runtime:** Node.js, TypeScript 5.7.3, ES2022 target, ESNext modules, bundler resolution, strict mode
- **Package manager:** pnpm
- **Schema validation:** Zod v4
- **API connection:** 4.8MB OpenAPI 3.1 spec (`agent/connections/resights-openapi.json`) — autogenerates tools at runtime

## Scaffolded directory layout

```
agent/                 # eve framework files (see existing sections below)
  agent.ts, instructions.md, channels/, connections/, tools/, skills/

lib/                   # shared convenience fetches
  resights.ts

web/                   # Next.js 15 frontend
  app/
    layout.tsx                          # html shell, theme tokens, viewport
    page.tsx                            # two-column chat + canvas workspace
    globals.css                         # Tailwind v4 + design tokens + shimmer
    api/eve/[...path]/route.ts          # same-origin proxy to eve NDJSON stream
  components/
    chat/                               # Conversation, Message, Reasoning, Shimmer, PromptInput
    canvas/                             # ArtifactCanvas + chart/card/table/map renderers
    ui/                                 # shadcn-style primitives (button, card, badge, ...)
  hooks/
    use-eve-chat.ts                     # wraps useEveAgent; derives canvas artifacts
    use-eve-chat-status.ts              # small status-string predicates
  lib/
    utils.ts                            # cn(), shortToolName(), formatters
    chat-types.ts                       # narrow types over EveMessagePart
    artifacts.ts                        # classify + parse tool outputs
  package.json, tsconfig.json, next.config.ts, postcss.config.mjs
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
  `ArtifactCanvas.tsx`) and **kebab-case** for routes (`page.tsx`,
  `route.ts`, `globals.css`) — these are Next.js conventions.
- Components are **client components** (`"use client"` at the top) unless they
  have no hooks/event handlers/state, in which case they can be server-only.
- Tailwind v4 + CSS variables defined in `app/globals.css` (`@theme inline`
  block) — extend the design system there, do not hard-code colors.
- New AI-element-shaped components should be added under `components/chat/`
  and reuse primitives from `components/ui/`.

## Design System

> See [`DESIGN.md`](./DESIGN.md) for the full spec. Summary below for agents.

This UI uses a **Light brutalist Swiss grid** — achromatic, flat, architectural.
It is modelled on shadcn/ui's own documentation aesthetic (Vercel/Linear lineage).

### Color palette (strictly achromatic — no chromatic colors)

| Token | Value | Role |
|-------|-------|------|
| `--color-graphite` | `#0a0a0a` | Primary text, primary button bg, emphasis borders |
| `--color-pure-black` | `#000000` | Body text, icon fills, darkest border |
| `--color-carbon` | `#171717` | Dark surface (inverted cards, dark mode bg) |
| `--color-concrete` | `#737373` | Secondary/muted text, placeholders |
| `--color-ash` | `#a1a1a1` | Disabled state borders |
| `--color-smoke` | `#b9b9b9` | Soft borders on less-emphasized containers |
| `--color-hairline` | `#e5e5e5` | **Structural color** — every card, input, table, nav border |
| `--color-mist` | `#f2f2f2` | Tag/pill backgrounds, ghost button hover, muted surfaces |
| `--color-chalk` | `#ffffff` | Page canvas, card surfaces, button text on dark fills |

### Tailwind semantic mappings (via `@theme inline` in `globals.css`)

| Tailwind class | Light value | Dark value |
|----------------|-------------|------------|
| `bg-background` / `bg-card` | chalk `#fff` | graphite `#0a0a0a` |
| `text-foreground` | graphite `#0a0a0a` | chalk `#fff` |
| `text-muted-foreground` | concrete `#737373` | smoke `#b9b9b9` |
| `bg-muted` / `bg-accent` | mist `#f2f2f2` | graphite `#0a0a0a` |
| `border-border` | hairline `#e5e5e5` | carbon `#171717` |
| `bg-primary` / `text-primary-foreground` | graphite + chalk | chalk + graphite |

### Typography

- **Font:** Geist (loaded via `next/font/google` in `layout.tsx`) as `--font-geist`
- **Mono:** Geist Mono as `--font-geist-mono`
- **Body:** 14px / 1.43 line-height / weight 400
- **Subhead:** 18px / 1.5 / weight 500 / -0.45px tracking
- **Display:** 48px / 1.1 / weight 600 / -2.4px tracking

### Border radius

| Context | Value | Tailwind equivalent |
|---------|-------|---------------------|
| Checkboxes, code snippets | 4px | `rounded-[4px]` |
| Buttons, inputs, nav, tool chips | 10px | `rounded-[10px]` |
| Cards, message bubbles | 14px | `rounded-[14px]` |
| Badges, tags | 26px | `rounded-[26px]` |
| Pills | 9999px | `rounded-full` |

### Component rules

- **Primary button:** `bg-foreground text-background` (graphite/chalk). The **only** filled CTA. No `bg-blue-*`, no chromatic fills.
- **Ghost button:** `bg-transparent text-foreground hover:bg-muted`. No border.
- **Outline button:** `border border-border bg-transparent`. No shadow.
- **Cards:** 1px `border-border` border, `bg-card`, `rounded-[14px]`, **no box-shadow**.
- **Inputs:** 1px `border-border`, `rounded-[10px]`, focus darkens border to `border-foreground`.
- **Badges/pills:** `bg-muted` or `bg-card border border-border`, `rounded-[26px]`, `text-xs`.
- **Separators:** 1px `bg-border` line — no decorative dividers.

### Do's and Don'ts

**DO:**
- Use `#e5e5e5` (`border-border`) for ALL borders — cards, inputs, dividers, nav
- Use `#0a0a0a` (`text-foreground`) for primary text; `#737373` (`text-muted-foreground`) for secondary
- Use `rounded-[10px]` for buttons/inputs, `rounded-[14px]` for cards
- Use Geist at 14px/400 for body, 14-16px/500 for labels, 48px/600 for display
- Keep section gaps at 48px (`gap-12`) and element gaps at 8px (`gap-2`)

**DON'T:**
- Do not use any chromatic color (blue, green, red, purple) for buttons, links, icons, or accents
- Do not use `shadow-*` utilities — no box-shadows for elevation; use borders only
- Do not use `rounded-lg` (which maps to 8px in Tailwind default) — use explicit `rounded-[10px]` or `rounded-[14px]`
- Do not use gradients (`bg-gradient-*`) — all fills are solid
- Do not place more than one `bg-foreground` filled button in the same region

### Environment

- `.env.example` is the template; `.env.local` is the actual file
  (gitignored). Eve loads it automatically.
- For the frontend optionally set `EVE_BASE_URL=http://localhost:3000`
  in `web/.env.local` if your eve lives somewhere other than localhost.

## Frontend dev workflow

```bash
pnpm dev:web   # just the Next.js app on http://localhost:3001
pnpm dev:all   # eve (:3000) + Next.js (:3001) together
pnpm typecheck # runs web tsc --noEmit
pnpm build:web # next build
```

The web app expects eve running on `:3000` (or wherever `EVE_BASE_URL`
points). The proxy at `/api/eve/*` strips CORS so the browser talks to the
same origin throughout.

## Key quirks

- The agent discovers API endpoints at runtime via `connection_search`. The
  `agent/connections/resights.ts` connection whitelists ~170 operations from
  28 API domains. Adding a new operation requires adding its operationId
  to the `operations.allow` array.
- `lib/resights.ts` is a separate convenience wrapper around raw `fetch`;
  not used by the agent's own tool calling — the agent uses the OpenAPI
  connection tools.
- Zod v4 — ensure `zod` v4 API is used throughout.
- The Leaflet map renders only on the client (`dynamic({ ssr: false })`)
  because Leaflet touches `window` at import time.
- The chat canvas reacts to **the newest tool call** only — it doesn't keep
  a tabbed history by design. If you need history, stack cards behind tabs
  inside `ArtifactCanvas`.

## No CI, no tests, no eslint

There are no test, lint, or CI scripts. `pnpm dev:all` is the day-to-day
command. `pnpm typecheck` runs `tsc --noEmit` against the web workspace as a
smoke check.
