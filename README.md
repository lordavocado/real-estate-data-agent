# Real Estate Data Analyst

An AI-powered real estate data analyst using [eve](https://eve.dev) + OpenAI with a live OpenAPI connection to Danish property and company registries.

The agent ships with a **single-column chat UI** (Next.js 15) built on [Vercel AI Elements](https://elements.ai-sdk.dev). Charts, tables, cards, and maps render **inline** beneath each tool step as the agent works.

## What it does

The agent discovers and calls property data API endpoints directly, pulling data from 2,500+ variables across 15+ Danish public registries (BBR, CVR, Tinglysningen, VUR, Plandata.dk, and more). It synthesizes findings into clear, structured reports for real estate professionals.

**Use cases:**

- Property due diligence (ownership, encumbrances, transaction history, energy labels)
- AVM valuation analysis (CatBoost + LGBM + KNN ensemble predictions)
- Investment analysis (cap rates, yield, sensitivity, market benchmarking)
- Market research (area trends, comparable sales, rental data)
- Development feasibility (zoning, buildable potential, residual land value)
- Ownership tracing (CVR network graphs, ultimate beneficial owners)
- Rental analysis (boxplots, scatterplots, area benchmarks)

## Setup

```bash
pnpm install:all
cp .env.example .env.local   # OPENAI_API_KEY, RESIGHTS_API_TOKEN, RESIGHTS_API_DOMAIN
```

Requires **Node.js 24+** for eve (Homebrew: `brew install node@24`). The dev scripts route through `scripts/with-node24.sh` automatically.

## Run

```bash
pnpm dev:all    # eve (:2000) + Next.js chat UI (:3001)
```

Then open http://localhost:3001.

| Command | What it runs |
|---------|----------------|
| `pnpm dev` | eve only → http://localhost:2000 |
| `pnpm dev:web` | Next.js UI only → http://localhost:3001 (needs eve running) |
| `pnpm dev:all` | Both together (recommended) |
| `pnpm smoke` | Quick E2E chat check via the proxy (needs `dev:all` running) |
| `pnpm typecheck` | TypeScript check for the web workspace |

If the UI breaks after a bad restart: `rm -rf web/.next && pnpm dev:all`

## Chat UI

Each assistant turn renders in three layers:

1. **Reasoning** — collapsible model thinking (auto-opens while streaming)
2. **Tool workflow** — [Chain of Thought](https://elements.ai-sdk.dev/components/chain-of-thought) + [Queue](https://elements.ai-sdk.dev/components/queue) step list with per-step status
3. **Answer** — final markdown response

Tool steps show inline artifacts (`present_chart`, `present_table`, `present_card`, `present_map`), `ask_question` HITL prompts, and expandable raw I/O for API tools.

Install additional AI Elements:

```bash
cd web && pnpm dlx shadcn@latest add "https://elements.ai-sdk.dev/api/registry/<name>.json"
```

## Project structure

```
agent/
├── agent.ts              # Model config (OpenAI gpt-5.5)
├── instructions.md         # System prompt
├── channels/eve.ts         # HTTP channel for chat UI
├── connections/resights.ts # OpenAPI connection (~170 allowed operations; internal id)
├── sandbox.ts              # justbash() sandbox (no Docker)
├── tools/                  # Calculators + present_chart/table/card/map
└── skills/                 # On-demand analysis workflows

lib/
├── resights.ts             # Convenience fetch wrapper for the property data API
└── fix_openapi_spec.ts     # Normalizes invalid OpenAPI examples at load time

web/
├── app/page.tsx            # Single-column chat
├── app/api/eve/[...path]/  # Same-origin proxy → eve backend
├── components/
│   ├── ai-elements/        # Vercel AI Elements (conversation, reasoning, tool, …)
│   └── chat/               # Eve adapters: assistant-turn, tool-workflow, artifacts
├── components/canvas/      # Recharts / table / card / Leaflet renderers
└── hooks/use-eve-chat.ts   # Wraps eve's useEveAgent
```

## Environment

| Variable | Where | Purpose |
|----------|-------|---------|
| `OPENAI_API_KEY` | `.env.local` | OpenAI API |
| `RESIGHTS_API_TOKEN` | `.env.local` | Property data API bearer token |
| `RESIGHTS_API_DOMAIN` | `.env.local` | API base URL (e.g. `https://api.resights.dk`) |
| `EVE_BASE_URL` | `web/.env.local` (optional) | Proxy target, default `http://localhost:2000` |

## Design

See [`DESIGN.md`](./DESIGN.md) for the achromatic Swiss brutalist UI spec. Agent conventions for contributors are in [`AGENTS.md`](./AGENTS.md).
