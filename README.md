# Resights Data Agent

An intelligent real estate data agent powered by [eve](https://eve.dev) and OpenAI, built to answer questions from real estate professionals — investors, developers, and asset managers — using the [Resights API](https://resights.dk).

## What it does

The agent queries the Resights API (2,500+ variables covering property data, company data, transactions, zoning, construction, and more) and synthesizes findings into clear, structured reports for real estate decision-making.

**Use cases:**
- Property due diligence (ownership, encumbrances, transaction history)
- Investment analysis (cap rates, yield, sensitivity, market benchmarking)
- Market research (area trends, comparable sales, rental data)
- Development feasibility (zoning, buildable potential, residual land value)
- Company/ownership structure tracing

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

This starts the eve agent locally with the chat UI on `http://localhost:3000`.

## Project structure

```
agent/
├── agent.ts            # Model config (OpenAI / GPT-5.5)
├── instructions.md     # System prompt — real estate domain knowledge
├── channels/
│   └── eve.ts          # HTTP channel for the chat UI
├── tools/              # Auto-discovered API tools
│   ├── search_properties.ts
│   ├── get_property_details.ts
│   ├── search_companies.ts
│   └── search_transactions.ts
└── skills/             # On-demand analysis workflows
    ├── property_due_diligence.md
    ├── investment_analysis.md
    ├── market_research.md
    └── development_feasibility.md
```

## How it works

1. A user asks a question (e.g. "Hvad er en fair pris for Borgergade 24?")
2. The agent reads its instructions and loads relevant skills
3. It calls Resights API tools to pull property data, transactions, ownership, etc.
4. It synthesizes findings and presents a structured analysis

The agent supports Danish and English, adapts to the user's language, and understands Danish real estate registers, metrics, and terminology.

## Data sources

The Resights API aggregates data from 15+ Danish public registries including BBR, CVR, Tinglysningen, EJF, MAT, DAR, VUR, Plandata.dk, and more. See the [Resights knowledge base](https://intercom.help/resights-aps/) for details.

## API access

The Resights API is a paid supplementary service. Contact mikkel@resights.dk for access and pricing.
