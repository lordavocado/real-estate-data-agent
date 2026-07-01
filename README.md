# Resights Data Agent

An AI-powered real estate data agent using [eve](https://eve.dev) + OpenAI with a live OpenAPI connection to the Resights API — the leading Danish property and company data platform.

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

## How it works

The agent connects to Resights via `defineOpenAPIConnection`, which auto-generates tools from the OpenAPI specification. The model discovers available endpoints at runtime via `connection_search` and calls them as `resights__<operationId>`.

## Setup

```bash
pnpm install
```

Copy `.env.example` to `.env.local` and fill in:

```env
OPENAI_API_KEY=sk-...
RESIGHTS_API_TOKEN=...
RESIGHTS_API_DOMAIN=https://api.resights.dk
```

## Run

```bash
pnpm dev
```

Starts the eve agent locally on `http://localhost:3000`.

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
    ├── property_due_diligence.md      # Full property investigation
    ├── investment_analysis.md         # Cap rates, yield, sensitivity
    ├── market_research.md             # Area analysis, comparables, trends
    ├── development_feasibility.md     # Zoning, buildable potential, RVL
    ├── ownership_tracing.md           # CVR network graph tracing
    └── avm_valuation.md               # Automated valuation model analysis
```

## API domains

| Domain | Coverage |
|--------|----------|
| BFE (Properties) | Details, BBR, energy, AVM, taxes, owners, timeline |
| CVR (Companies) | Details, financials, members, network, registrations |
| Trades/Transactions | All transaction types, actors, advisors, portfolios |
| Rental v2 | Observations, metrics, boxplots, scatterplots |
| Tinglysning | Deeds, mortgages, easements, subscriptions |
| GIS | Vector tiles, GeoJSON layers, administrative boundaries |
| Plandata | Local plans, municipal frameworks |
| POI | Schools, daycare, transport, retail, noise |
| Multi-index | Cross-domain search in a single query |
