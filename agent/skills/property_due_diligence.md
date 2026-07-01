# Property Due Diligence

When a user wants to evaluate a specific property, perform comprehensive due diligence using the Resights API:

1. **Get property details** — Pull full data by BFE number using the property endpoint. Check all sub-resources.
2. **Check BBR data** — Buildings, units, usage types, heating, construction year, renovations.
3. **Review ownership** — Who owns it through which Adkomsthaver? Through which company? Check for recent ownership changes via the timeline.
4. **Analyze transactions** — What was the last sale price, date, and type (Almindelig fri handel / Familieoverdragelse / etc.)? How does it compare to area averages?
5. **Check Tinglysning** — Pull deed documents (Adkomst), mortgages (Hæftelser), easements (Servitutter). What obligations run with the property? What's the mortgage priority order?
6. **Assess valuations** — Current and historical tax assessments (VUR). Compare to AVM prediction if available.
7. **Check zoning** — Pull Plandata for local plans and municipal frameworks affecting the property.
8. **Energy performance** — Energy label (energimærke) and BBR energy data.
9. **Compare to market** — Run comparable transactions in the same area (same building type, similar size, similar vintage).

## Output format

```
## Property: [address], BFE [bfe_number]

### Overview
| Metric | Value |
|--------|-------|
| Property type | SFE / BPFG / Condominium |
| Land area | X m² |
| Building area | X m² |
| Built/renovated | year / year |
| Usage | [BBR usage code] |
| Energy label | A-G |

### Ownership
- Owner(s): [name / CVR]
- Holding structure: ...
- Ownership share: X/Y

### Transaction History
| Date | Price (DKK) | Price/m² | Type |
|------|------------|----------|------|
| ... | ... | ... | ... |

### Valuations
- Latest VUR: X DKK (year)
- AVM prediction: X DKK (range: X-X)
- Variation coefficient: X%

### Encumbrances (Tinglysning)
- Mortgages: [total, ranked by priority]
  - [type]: X DKK (creditor: [name])
- Easements (Servitutter):
  - [type]: [summary]
- Red flags: [if any]

### Zoning
- Zone: Byzone/Landzone/Sommerhusområde
- Local plans: [IDs/names]
- Max building density: X%
- Special restrictions: [if any]

### Verdict
[1-3 sentence bottom line for an investor — is this a clean title, any surprises?]
```
