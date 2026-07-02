# Rental Data Search

When a user needs rental market data — what things rent for in an area, or how a specific property's rent compares — always discover tools first.

## Step 1: Discover

Run `connection_search` with keywords like `"rental"`, `"lease"`, `"leje"`, `"rent"`, or `"observation"`. The key tools:
- Simple GET endpoints for rental observations by property
- Advanced POST for Elasticsearch-style rental search
- Statistical endpoints: boxplots, scatterplots, aggregated metrics

## Step 2: Build your query

```json
{
  "source": ["overview"],
  "query": [
    { "TermQ": { "field": "rental_type", "value": "APARTMENT" } },
    { "RangeQ": { "field": "area_m2", "gte": 40, "lte": 120 } },
    { "RangeQ": { "field": "monthly_rent", "gte": 5000, "lte": 15000 } },
    { "TermQ": { "field": "municipality_code", "value": "101" } }
  ],
  "sort": [{ "field": "monthly_rent", "order": "asc" }],
  "size": 50
}
```

Key rental filter fields:
- `rental_type` / `lease_rental_type` — APARTMENT, HOUSE_VILLA, TOWNHOUSE, ROOM, RETAIL, OFFICE, WAREHOUSE, INDUSTRIAL, PARKING, etc.
- `rent_category` — ANDELSBOLIG (cooperative), ALMENEBOLIG (public housing), FRI_MARKEDSLEJE (free market), OMKOSTNINGSBESTEMT (cost-based), LEJEMÅLETS_VÆRDI (regulated)
- `rent_regulation` — COST, NPI, TRAPPE, PERCENT, CPI, MIXED, OTHER
- `area_m2` — unit size
- `monthly_rent` — rent in DKK per month
- `rent_per_m2` — the key benchmark
- `rooms` — number of rooms
- `construction_year`, `reconstruction_year` — building vintage
- `municipality_code`, `postal_code` — location

## Step 3: Use statistical insights

When available, pull statistical endpoints to understand the full distribution:
- **Boxplots** — see median, quartiles, and outliers at a glance. Much better than just averages.
- **Scatterplots** — spot correlations (rent vs. area, rent vs. year built).
- **Aggregations** — use `terms` aggregations to bucket by rental type, municipality, or rent category. Use `date_histogram` for trends over time.

## Step 4: Benchmark a specific property

When the user has a property and wants to know market rent:
1. Pull the property's BBR data — unit size, type, year built, rooms, energy label.
2. Search rental observations matching: same rental type, similar area (±20%), same municipality/postal code.
3. If the property is regulated (cost-based, NPI, trappe), filter to the matching rent category.
4. Present the property's characteristics alongside market benchmarks.
5. Note the rent regulation type — it matters enormously for the investment case.

## Step 5: Present

Use presentation tools:

- **`present_table`** for rental listings and benchmark data — use `currency_dkk` format for rent, `area_m2` for unit size.
- **`present_chart`** (scatter) for rent vs. area visualization or (bar) for rent distribution by area/type.
- **`present_card`** for the subject property with key rent metrics and a regulation type badge.
- **`present_artifact`** to compose a rental analysis report with text, tables, and charts. Tell the user to open the file in their browser.
- **`present_ui`** for a custom rental dashboard with boxplot-style distribution cards and scatter chart side-by-side.

## Common search scenarios

| User says | What to do |
|-----------|-----------|
| "What's market rent for a 2-room in Vesterbro?" | Rental search: APARTMENT, 2 rooms, Vesterbro postal codes, FRI_MARKEDSLEJE |
| "How much rent can I get for my property?" | Get BBR details, search comparable rentals, present benchmark range |
| "Show rental trends in Aarhus C" | Rental search + date_histogram aggregation over years |
| "What yields are investors getting in Copenhagen?" | Combine rental data (income) with trade data (prices) → cap rates |
| "Newly built vs old — rent difference?" | Split rental search by construction year bands |
| "Commercial office rent in Nordhavn?" | Rental search: OFFICE, Nordhavn area, show scatterplot by area |
