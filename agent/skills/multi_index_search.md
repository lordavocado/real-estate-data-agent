# Multi-Index Search

When a user asks a broad question that spans multiple domains, or when you're not sure which domain contains the answer, use multi-index search to query everything at once.

## Step 1: Discover

Run `connection_search` with keywords like `"multi"`, `"multi_index"`, or `"search"`. The key tool searches across ALL indices simultaneously:
- `properties`
- `cvr_companies`
- `cvr_members`
- `cvr_p_units`
- `ejf_persons`
- `ejf_others`
- `trades`
- `pre_projects`
- `pre_tenders`
- `listings`
- `financials`

## Step 2: Build your query

The multi-index query uses the same `QueryWithTemplate` DSL but can target fields across all indices:

```json
{
  "source": ["overview"],
  "query": [
    { "MatchQ": { "field": "address", "value": "Borgergade 24" } },
    { "Bool": { "should": [
      { "TermQ": { "field": "municipality_code", "value": "101" } }
    ] } }
  ],
  "size": 25
}
```

## When to use multi-index search

Use multi-index when:
- The user provides a name/address but you don't know if it's a company, property, or person
- The user asks "tell me everything about X" — check all domains
- You're doing initial discovery on a lead or contact
- The user asks a cross-domain question like "who owns real estate in this area?"
- You're building a dossier — pull everything with one query, then drill into specific results

Don't use multi-index when:
- The user's intent is clearly domain-specific (property, CVR, trade, rental)
- You need domain-specific filters that only exist on one index
- Performance matters — single-index queries are faster

## Step 3: Interpret results

Multi-index results contain mixed entity types. For each result:
1. Check the `_index` or entity type to know what you're looking at.
2. Each domain has a different set of available fields — inspect what's returned.
3. Prioritize results from the domain most relevant to the user's intent.
4. Use matching results as entry points — pull full details from the specific domain endpoint.

## Step 4: Present

Multi-index results are mixed. Present them clearly:

- **`present_card`** for the most relevant entity found — use as an entry point to deeper analysis.
- **`present_table`** to list matching entities grouped by type (properties, companies, persons, trades).
- **`present_chart`** to show the distribution of results across indices (pie chart: how many from each domain).
- **`present_artifact`** to compose the mixed results into a single search report with sections per domain.
- **`present_card` + `present_chart` + `present_table`** for a custom search results page with domain tabs/sections and highlighted top matches.

## Common search scenarios

| User says | What to do |
|-----------|-----------|
| "Tell me about 'Ejendom Danmark'" | Multi-index: could be a company, might have properties |
| "What's at Borgergade 24?" | Multi-index by address — returns property, any companies registered there, trades |
| "Who operates in Gentofte?" | Multi-index filtered by municipality → properties, companies, trades |
| "Find everything related to CVR 12345678" | Multi-index + property search by owner CVR |
| "I have a lead named 'Anders Jensen'" | Multi-index search name across companies (members), persons (EJF), trades |
