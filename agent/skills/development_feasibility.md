# Development Feasibility

When a user asks what can be built on a property or site, assess development potential. Always discover tools first.

## Step 1: Discover

Run `connection_search` with `"property"`, `"bbr"`, `"plan"`, `"gis"`, `"zone"`, and `"trade"`. You need:
- Property and BBR data for site characteristics
- Plandata for zoning rules
- GIS layers for constraints (conservation, contamination, flood)
- Trade data for comparable land transactions

## Step 2: Gather site data

1. **Property details** — Land area (m²), current buildings (area, usage, construction year), ownership.
2. **BBR data** — Building density (bebyggelsesprocent), floor area, height, number of floors.
3. **Zoning** — Pull local plans (lokalplaner) and municipal framework (kommuneplanramme). Key data:
   - Allowed uses (residential, commercial, mixed, industrial)
   - Max building density (bebyggelsesprocent)
   - Max height (in meters and/or floors)
   - Max floor area ratio
   - Special provisions (parking requirements, green space, facade rules, preservation)

## Step 3: Check constraints

Pull GIS layers relevant to the site:
- **Conservation** — Protected buildings (SLKS), cultural heritage, conservation areas
- **Contamination** — Soil contamination markers (jordforurening, V1/V2 classification)
- **Flood risk** — Coastal proximity, flood zones, climate adaptation plans
- **Infrastructure** — Road access, utilities, noise zones (trafikstøj)
- **Nature** — Protected habitats (Natura 2000), forest preservation, coastal protection zone

## Step 4: Calculate buildable potential

```
Max buildable m²    = land area × max building density
Current built m²    = sum of existing building areas
Remaining potential = max buildable - current built
```

If the site can be subdivided or redeveloped:
```
Gross floor area (GFA)   = land area × max FAR
Net sellable area         = GFA × efficiency factor (~0.85 for residential, ~0.90 for commercial)
```

## Step 5: Financial feasibility

Find comparable land transactions:
- Vacant lots (ubebygget grund) in the same or nearby municipality
- Development sites with similar zoning potential
- Price per buildable m²

Estimate construction costs:
- New build residential: ~20,000–28,000 DKK/m² (varies by quality and location)
- New build commercial: ~16,000–24,000 DKK/m²
- Renovation/conversion: ~12,000–20,000 DKK/m²

Estimate end values:
- Pull comparable new-build sales in the area
- Use AVM on nearby new-build properties

Residual land value:
```
End value of completed project
- Construction costs
- Soft costs (architects, permits, fees — ~10-15%)
- Financing costs
- Developer profit (typically 15-20% of total cost)
= Residual land value (max you should pay for the site)
```

## Output format

Use presentation tools:

- **`present_card`** for the Site Data, Constraints & Risks, and Verdict — with red/green badges for risk status.
- **`present_table`** for the Buildable Potential scenarios, Comparable Land Transactions, and Residual Land Value calculation.
- **`present_chart`** (horizontal bar) to compare buildable m² across scenarios.
- **`present_map`** with the property boundary and nearby zoning layers / comparable land trades as markers.
- **`present_artifact`** to compose the full feasibility report — combine headings, text, cards, tables, chart, and map into one HTML file.
- **`present_ui`** for a custom development dashboard with a land value waterfall chart + site map side-by-side.
