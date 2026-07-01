# Market Research

When a user wants to understand a geographic market or area, perform this research:

1. **Area definition** — Confirm the municipality, postal code(s), or specific neighborhood the user is interested in.
2. **Transaction activity** — Pull recent transactions in the area. Summarize volume, price trends, and sale types (arms-length vs. related-party).
3. **Price levels** — Calculate median and average price per m² for different building types (villa, ejerlejlighed, commercial).
4. **Rental market** — Pull rental data for the area. Compare rent levels per m² by unit type/size.
5. **Ownership concentration** — Identify top property owners in the area. Is the market fragmented or concentrated?
6. **Development pipeline** — What's under construction? What local plans are pending? Any large development sites?
7. **Demographics** — Population, income levels, household composition (if available via Resights or the user provides).

## Output format

```
## Market Research: [area / postal code / kommune]

### Overview
| Metric | Value |
|--------|-------|
| Municipality | X |
| Postal codes | X, Y, Z |
| Population | X (year) |

### Transaction Activity (last 12 months)
| Building type | Transactions | Median price/m² | YoY change |
|--------------|-------------|----------------|------------|
| Villa | X | X DKK | +/- X% |
| Ejerlejlighed | X | X DKK | +/- X% |
| Commercial | X | X DKK | +/- X% |

### Rental Market
| Unit type | Rent/m² (median) | Observations |
|-----------|-----------------|--------------|
| Residential | X DKK | X |
| Commercial | X DKK | X |

### Top Owners
| Owner | Properties | Total m² |
|-------|-----------|---------|
| ... | ... | ... |

### Development Pipeline
- Active projects: [count]
- Pending local plans: [count]
- Notable: [key projects]

### Sentiment
[1-3 sentence market read — hot, cold, value play, overheated, etc.]
```
