# Property Due Diligence

When a user wants to evaluate a specific property, perform comprehensive due diligence:

1. **Get property details** — Pull full data by BFE number or address.
2. **Check ownership** — Who owns it? Through which company? Any holding structure?
3. **Review transactions** — What was the last sale price and date? How does it compare to area averages?
4. **Assess encumbrances** — Mortgages, servitudes, easements. What obligations run with the property?
5. **Check zoning** — What does the local plan and municipal framework allow?
6. **Pull tax data** — Property tax, land tax, any outstanding liabilities.
7. **Compare to market** — Run comparable sales in the same area, same building type, similar size.

## Output format

Present findings as a structured report:

```
## Property: [address], [BFE nr.]
### Overview
| Metric | Value |
|--------|-------|
| Type | [ejerlejlighed/villa/etc.] |
| Area | [X m²] |
| Built | [year] |
| ... | ... |

### Ownership
- Owner: [name/CVR]
- Holding structure: ...
- Director/contact: ...

### Transaction History
- Last sale: [date] at [price] ([type])
- Price per m²: [DKK]
- Area avg per m²: [DKK] (diff: +/- X%)

### Encumbrances & Risk Factors
- Mortgages: [total, rank order]
- Servitudes: [key ones]
- Red flags: [if any]

### Development Potential
- Zoning: [current + what's allowed]
- Buildable area: [if applicable]

### Verdict
[1-3 sentence bottom line for an investor]
```
