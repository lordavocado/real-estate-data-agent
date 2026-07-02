# Resights Data Agent

An AI-powered real estate data agent using [eve](https://eve.dev) + OpenAI with a live OpenAPI connection to the Resights API — the leading Danish property and company data platform.

The agent now ships with a chat-style web frontend built on Next.js 15 — chat on the left, a live artifact canvas (charts, cards, tables, maps) on the right.

## What it does

The agent discovers and calls Resights API endpoints directly, pulling data from 2,500+ variables across 15+ Danish public registries (BBR, CVR, Tinglysningen, VUR, Plandata.dk, and more). It synthesizes findings into clear, structured reports for real estate professionals.

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
pnpm install
pnpm --filter web install   # if web/ is not picked up by the workspace
cp .env.example .env.local  # fill in OPENAI_API_KEY, RESIGHTS_API_TOKEN, RESIGHTS_API_DOMAIN
```

## Run

```bash
pnpm dev       # eve only, on http://localhost:3000
pnpm dev:web   # Next.js chat UI only, on http://localhost:3001 (needs eve running on :3000)
pnpm dev:all   # both together
```

Then open http://localhost:3001.

## Project structure

```
agent/
├── agent.ts                           # Model config (OpenAI / GPT-5.5)
├── instructions.md                    # System prompt with Resights domain knowledge
├── channels/
│   └── eve.ts                         # HTTP channel for chat UI
├── connections/
│   ├── resights.ts                    # OpenAPI connection (auto-generates API tools)
│   └── resights-openapi.json          # Full OpenAPI 3.1 spec (5MB, 200+ endpoints)
└── skills/                            # On-demand analysis workflows
    ├── property_due_diligence.md
    ├── investment_analysis.md
    ├── market_research.md
    ├── development_feasibility.md
    ├── ownership_tracing.md
    └── avm_valuation.md

lib/
└── resights.ts                        # shared typed fetch wrapper

web/                                   # Next.js 15 frontend
├── app/
│   ├── layout.tsx                     # html shell, theme tokens, viewport
│   ├── page.tsx                       # Chat panel (left) + Artifact canvas (right)
│   ├── globals.css                    # Tailwind v4 + design tokens + shimmer
│   └── api/eve/[...path]/route.ts     # same-origin NDJSON proxy to eve
├── components/
│   ├── chat/                          # AI-Elements-style: Conversation, Message, Reasoning, Shimmer, PromptInput
│   └── canvas/                        # Recharts / Card / Table / Leaflet artifact renderers
├── hooks/use-eve-chat.ts              # wraps eve's useEveAgent + derives canvas artifacts
└── package.json, tsconfig.json, next.config.ts
```
