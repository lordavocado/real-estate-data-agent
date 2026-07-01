# Property Search

When a user needs to find properties matching specific criteria, always discover the API tools first — never assume endpoint names.

## Step 1: Discover

Run `connection_search` with keywords like `"property"`, `"properties"`, `"bfe"`, or `"search"`. You'll find multiple tools — pick the one whose description matches your task:
- A simple GET endpoint for lookups by BFE number or address
- An advanced POST endpoint accepting an Elasticsearch-style `QueryWithTemplate` body for complex filtering
- A multi-index search that includes properties alongside other domains

## Step 2: Choose your approach

### Simple lookup (known ID or address)
If the user provides a BFE number, SFE number, cadastre (matrikel), address, or municipality code — use the simple GET endpoint with the corresponding query parameter.

### Advanced search (criteria-based)
When filtering by attributes (area range, price range, building type, year built, ownership code, zone, municipality, etc.), use the advanced POST endpoint. The body uses Elasticsearch DSL:

```json
{
  "source": ["overview"],
  "query": [
    { "TermQ": { "field": "property_type", "value": "SFE" } },
    { "RangeQ": { "field": "land_area_m2", "gte": 500, "lte": 2000 } }
  ],
  "sort": [{ "field": "land_area_m2", "order": "desc" }],
  "page": "",
  "size": 25
}
```

Key query nodes:
- **TermQ** — exact match (e.g., `property_type`, `municipality_code`, `ownership_code`)
- **TermsQ** — match any of several values
- **MatchQ** — full-text search on addresses/names
- **RangeQ** — numeric/date ranges (use `gte`, `lte`, `gt`, `lt`)
- **ExistsQ** — check if a field is present
- **GeoBBoxQ** — geographic bounding box
- **GeoDistanceQ** — radius search around a point
- **BooleanQueryNode** — combine with `and`/`or`/`not`

Common filterable fields:
- `property_type` — SFE, BPFG, CONDOMINIUM
- `municipality_code` — 3-digit kommune code
- `ownership_code` — 10-99
- `zone` — Byzone, Landzone, Sommerhusområde
- `land_area_m2`, `building_area_m2`
- `construction_year`, `reconstruction_year`
- `latest_trade_price`, `latest_trade_year`
- `assessed_value`, `land_value`
- `usage_code` — BBR usage code (110 = residential villa, etc.)

## Step 3: Interpret results

Results come in pages: `{"total": N, "offset": 0, "size": 25, "results": [...]}`. Each result has at minimum the fields requested via `source`. Check:
- `total` — how many matches? Too many → add filters. Too few → broaden.
- `source` — what sub-documents are included? Use `"overview"` for summary, add more sources for detail.

## Step 4: Follow up

Once you have property results, select the most relevant ones and drill deeper:
- Pull full property details by BFE number → check ownership, taxes, trades, energy label
- Pull BBR data for building/unit specifics
- Pull GIS layers for zoning context
- Compare to nearby transactions
- Run AVM valuation

## Common search scenarios

| User says | What to do |
|-----------|-----------|
| "Find me a villa in Gentofte under 10M" | Search properties with `property_type: "SFE"`, `municipality_code: <Gentofte>`, `latest_trade_price` range, BBR usage for villa |
| "Hvem ejer X-gade 5?" | Simple lookup by address, then follow owner chain |
| "Show all commercial properties > 500m² in Aarhus" | Search with `building_area_m2` range + municipality + commercial usage codes |
| "What's for sale near me?" | Search listings with geo distance query |
| "Development sites in Copenhagen with zoning for residential" | Combine property search with Plandata zoning query |
