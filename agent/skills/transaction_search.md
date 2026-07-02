# Transaction Search

When a user wants to find real estate transactions, trades, or comparable sales, always discover tools first.

## Step 1: Discover

Run `connection_search` with keywords like `"trade"`, `"transaction"`, `"sale"`, `"handel"`, or `"investment"`. The key tools:
- Simple GET endpoints for trades by property/company
- Advanced POST endpoints for Elasticsearch-style search with rich filtering
- Investment transaction endpoints (commercial/office/retail/industrial)
- Residential transaction endpoints
- Agriculture transaction endpoints
- Portfolio trade endpoints (all trades by a member/company)

## Step 2: Build your query

```json
{
  "source": ["overview"],
  "query": [
    { "TermQ": { "field": "property_type", "value": "SFE" } },
    { "RangeQ": { "field": "trade_date", "gte": "2023-01-01", "lte": "2024-12-31" } },
    { "RangeQ": { "field": "price", "gte": 1000000, "lte": 5000000 } },
    { "TermsQ": { "field": "acquisition_method", "values": ["Almindelig fri handel"] } }
  ],
  "sort": [{ "field": "trade_date", "order": "desc" }],
  "page": "",
  "size": 50
}
```

Key trade filter fields:
- `price` — trade price in DKK
- `trade_date` — when the trade occurred
- `property_type` — SFE, BPFG, CONDOMINIUM
- `acquisition_method` — Almindelig fri handel, Familieoverdragelse, Interessesammenfald, etc.
- `building_area_m2`, `land_area_m2` — size ranges
- `municipality_code` — 3-digit kommune
- `price_per_m2` — the key benchmark metric

Investment transaction fields (additional):
- `asset_type` — RESIDENTIAL, COMMERCIAL, OFFICE, RETAIL, INDUSTRY_LOGISTICS, AGRICULTURE, HOTEL, etc.
- `asset_sub_type` — 40+ subtypes
- `asset_stage` — DONE, EXISTING, LAND, NEW_DEVELOPMENT, UNDER_CONSTRUCTION
- `risk_segment` — CORE, CORE_PLUS, VALUE_ADD, OPPORTUNISTIC
- `cap_rate` — directly available as a filter field

## Step 3: Build comparables

When a user wants to know "what's a fair price?":
1. First find the subject property's details (area, type, location, year).
2. Search for transactions matching the same type, similar size (±30%), same municipality or nearby, and arms-length only (`acquisition_method: "Almindelig fri handel"`).
3. Sort by recency (last 12-24 months ideally) and proximity.
4. Calculate median, average, P25, P75 of price/m².
5. Present as a comparable set with the subject property highlighted.

## Step 4: Present

Use presentation tools to format the results:

- **`present_table`** for lists of comparable transactions — use column formatting: `currency_dkk` for prices, `area_m2` for area, `date` for trade dates.
- **`present_chart`** (bar) to show price/m² distribution across comparables, using the subject property as a highlighted reference line.
- **`present_card`** to highlight the subject property with key metrics and a badge indicating "over/under median".
- **`present_map`** with markers for all comparables + the subject property, color-coded by price/m² percentile.
- **`present_artifact`** to compose the full comparable analysis — headings explaining the criteria, the map showing locations, the table of comparables, and charts for distribution. Tell the user to open the file in their browser.
- **`present_ui`** for a custom comparables dashboard with scatter plot of price vs area, map, and sorted table.

## Common search scenarios

| User says | What to do |
|-----------|-----------|
| "What did properties sell for in Østerbro last year?" | Trade search with postal codes + municipality + date range |
| "Find comparable sales for this property" | Get property type/area, search trades ±30% size, same kommune, last 24 months |
| "Show me all investment transactions > 50M in 2024" | Investment trade search with price range + date |
| "What's the average m² price for villas in Aarhus?" | Trade search + aggregate on price_per_m2 |
| "Who sold and who bought?" | Pull CVR details for buyer and seller from trade results |
| "Any family transfers in this area?" | Filter acquisition_method for Familieoverdragelse |
