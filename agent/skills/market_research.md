# Market Research

When a user wants to understand a geographic market, use Resights to build a comprehensive picture. Always discover tools first.

## Step 1: Define the market + discover

Run `connection_search` with `"trade"`, `"rental"`, `"cvr"`, `"plan"`, `"gis"`, and `"poi"`. Confirm the geographic scope with the user:
- Municipality (kommune)?
- Postal code(s)?
- Neighborhood or bounding box?

## Step 2: Pull market data

Work through these layers, one at a time:

1. **Transaction activity** — Search trades in the area (last 12-24 months). If possible, run a `terms` aggregation on `property_type` and a `date_histogram` to see trends. Separate arms-length from family transfers.
2. **Price levels** — Calculate median/average price per m² per property type. Compare to previous year for trend direction.
3. **Rental market** — Search rental observations in the area. If statistical endpoints are available, pull boxplots to see the full distribution (not just averages — outliers can mislead).
4. **Top owners** — Search properties in the area, aggregate by owner CVR, rank by total m² or count. Then pull CVR details on the top 5-10.
5. **Development pipeline** — Pull Plandata for the area. Active local plans? Pending ones? Construction projects underway?
6. **POI context** — Schools, daycare, public transport stops, retail density. What's within walking distance?
7. **Ownership concentration** — Is the market dominated by a few institutional owners or fragmented among many private owners?

## Step 3: Analyze

Synthesize the layers:

- **Hot or cold?** Compare transaction volume to previous year. Are prices rising or falling?
- **Who's active?** Institutional buying (CORE/CORE_PLUS) or private buyers? New entrants?
- **Rental pressure?** Rent trends, vacancy implied by supply, new construction pipeline.
- **Owner risk?** If concentration is high, the market may be sensitive to one player's decisions.

## Output format

```
## Market Research: [area / kommune]

### Overview
| Metric | Value |
|--------|-------|
| Municipality | X |
| Postal codes | X, Y, Z |

### Transaction Activity (last 12 months)
| Property type | Transactions | Median price/m² | P25 | P75 | Trend |
|--------------|-------------|----------------|-----|-----|-------|
| Villa/rækkehus | X | X DKK | X | X | ↑ / ↓ / → |
| Ejerlejlighed | X | X DKK | X | X | ↑ / ↓ / → |
| Commercial | X | X DKK | X | X | ↑ / ↓ / → |

### Price Distribution (ejerlejlighed)
- Entry-level (P10): X DKK/m²
- Median: X DKK/m²
- Premium (P90): X DKK/m²

### Rental Market
| Unit type | Rent/m² (median) | P25 | P75 | Regulation |
|-----------|-----------------|-----|-----|-----------|
| Residential | X DKK | X | X | [free/regulated/mixed] |
| Commercial | X DKK | X | X | [free/regulated] |

### Top Property Owners
| Owner (CVR) | Properties | Total m² | Market share |
|-------------|-----------|---------|-------------|
| ... | X | X | X% |

### Development Pipeline
- Active local plans: X
- Notable projects: [list]
- Expected new supply: ~X m² over next X years

### POI Highlights
- Schools within 1km: X
- Public transport stops: X
- Retail density: [high/medium/low]

### Market Sentiment
[Summary: price direction, transaction velocity, institutional activity, supply pipeline, overall risk/reward assessment.]
```
