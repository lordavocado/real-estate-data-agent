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

## Step 4: Follow up

Once you have target companies:
- **Ownership graph** — Pull the `network` to see the ownership chain (COMPANY → MEMBER → COMPANY relations). Look for LEGAL_OWNERSHIP and REAL_OWNERSHIP edges.
- **Expand network** — Go multiple levels deep with `expand_network` to find ultimate beneficial owners.
- **Partners in crime** — Find co-owned properties and shared directorships.
- **Property portfolio** — Search properties by owner CVR to see what real estate they hold.
- **Financial history** — Pull annual reports to see revenue/profit trends.
- **Members** — See directors (direktør), board members (bestyrelse), and owners (reel ejer).

## Common search scenarios

| User says | What to do |
|-----------|-----------|
| "What companies does Jeudan own?" | CVR lookup + expand network graph |
| "Find all APS companies in real estate in Copenhagen" | Search companies with type filter + industry + municipality |
| "Who owns this company?" | Pull network graph, follow LEGAL_OWNERSHIP edges up |
| "Show me competitors to X" | Search by same industry code, similar employee range |
| "Is this company still active?" | Simple CVR lookup, check status field |
| "What properties does this CVR own?" | Search properties by owner CVR number |
