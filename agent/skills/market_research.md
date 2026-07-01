# Market Research

When a user wants to understand a geographic market, use Resights to run a full area analysis:

1. **Define the market** — Confirm municipality (kommune), postal code(s), or bounding box. Use Resights GIS/geospatial endpoints to map the area.
2. **Transaction activity** — Pull recent transactions in the area via ES-style queries with geo filters. Analyze volume, price trends, and sale types.
3. **Price levels** — Calculate median and average price per m² per building type using analysis/aggregation endpoints.
4. **Rental market** — Pull rental observations for the area. Get boxplots/scatterplots to understand rent distribution by unit type and size.
5. **Ownership concentration** — Identify the top property owners in the area using CVR network/ownership tools.
6. **Development pipeline** — Check local plans (lokalplaner) for active and pending developments.
7. **POI analysis** — Schools, daycare, public transport, retail within the area.
8. **Demographics** — Use DST data via analysis tables if available.

## Output format

```
## Market Research: [area / postal code / kommune]

### Overview
| Metric | Value |
|--------|-------|
| Municipality | X |
| Postal codes | X, Y, Z |

### Transaction Activity (last 12 months)
| Building type | Transactions | Median price/m² | YoY |
|--------------|-------------|----------------|-----|
| Villa/rækkehus | X | X DKK | +/- X% |
| Ejerlejlighed | X | X DKK | +/- X% |
| Commercial | X | X DKK | +/- X% |

### Rental Market
| Unit type | Rent/m² (median) | P25 | P75 |
|-----------|-----------------|-----|-----|
| Residential | X DKK | X | X |
| Commercial | X DKK | X | X |

### Top Property Owners
| Owner (CVR) | Properties | Total m² |
|-------------|-----------|---------|
| ... | ... | ... |

### Development Pipeline
- Active local plans: [count]
- Notable projects: [key developments]

### Market Sentiment
[1-3 sentence read on the market — hot, cooling, value play, overheated, etc.]
```
