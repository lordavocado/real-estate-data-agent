# Company Search

When a user needs to find companies (CVR), always start by discovering available tools.

## Step 1: Discover

Run `connection_search` with keywords like `"cvr"`, `"company"`, `"companies"`, `"virksomhed"`, or `"network"`. The key tools:
- Simple GET endpoint for lookup by CVR number
- Advanced POST endpoint for Elasticsearch-style search across all companies
- Network/graph endpoints for ownership tracing
- Financials endpoints for annual reports
- Members/P-unit endpoints for people associated with the company

## Step 2: Choose your approach

### By CVR number (exact lookup)
If the user has a CVR number (8 digits), use the simple GET endpoint. This returns the full company profile.

### By name or criteria (search)
Use the advanced POST endpoint with `QueryWithTemplate`:

```json
{
  "source": ["overview", "financials"],
  "query": [
    { "MatchQ": { "field": "name", "value": "Ejendom" } },
    { "TermsQ": { "field": "company_type", "values": ["APS", "A/S"] } },
    { "RangeQ": { "field": "employees_count", "gte": 10 } },
    { "TermQ": { "field": "status", "value": "AKTIV" } }
  ],
  "sort": [{ "field": "revenue", "order": "desc" }],
  "page": "",
  "size": 25
}
```

Key filterable fields:
- `name` — full-text search on company name
- `cvr_number` — exact CVR number
- `company_type` — ENK, APS, A/S, I/S, K/S, FON, IVS, SMBA, and many more
- `status` — AKTIV, NORMAL, OPHØRT, UNDER_KONKURS, TVANGSOPLØST
- `industry_code` — DB branchekode
- `employees_count` — employee range bands
- `revenue`, `profit_loss`, `equity`, `total_assets` — financial figures
- `municipality_code` — company address
- `registration_date` — when the company was founded

## Step 3: Interpret results

Check `total` and refine filters. Then for each interesting result:
- **Name + CVR** — the basics
- **Financials** — revenue, profit, equity, assets (check for recent filings)
- **Status** — is the company active?
- **Employees** — rough size indicator
- **Industry** — what sector?

## Step 4: Present

Use presentation tools to format company results:

- **`present_card`** for a single company lookup — title (name + CVR), sections for financials, members, and properties. Use badges for status (Aktiv, Under konkurs, Ophørt) and industry.
- **`present_table`** for lists of companies — show name, CVR, type, status, revenue, employees.
- **`present_chart`** (bar) for comparing financials across companies or revenue trend over years.
- **`present_artifact`** to compose a company profile report with card, tables, and financial charts.
- **`present_ui`** for a custom company dashboard with financial KPIs as metric cards + network overview.

## Common search scenarios

| User says | What to do |
|-----------|-----------|
| "What companies does Jeudan own?" | CVR lookup + expand network graph |
| "Find all APS companies in real estate in Copenhagen" | Search companies with type filter + industry + municipality |
| "Who owns this company?" | Pull network graph, follow LEGAL_OWNERSHIP edges up |
| "Show me competitors to X" | Search by same industry code, similar employee range |
| "Is this company still active?" | Simple CVR lookup, check status field |
| "What properties does this CVR own?" | Search properties by owner CVR number |
