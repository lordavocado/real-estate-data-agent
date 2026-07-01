# Development Feasibility

When a user asks about building potential on a property, use Resights to assess:

1. **Site overview** — Pull property details, BBR buildings/units, land area, current built area, building density.
2. **Zoning analysis** — Pull Plandata for lokalplaner and kommuneplanrammer. Max building height, density, and allowed uses.
3. **Buildable potential** — Calculate: max buildable m² = land area × allowed density. Remaining potential = max - current built.
4. **Risk factors** — Check GIS layers for conservation areas, contaminated land (jordforurening), coastal proximity, flood risk, protected buildings (SLKS).
5. **Comparable projects** — Search transactions for development sites in the area. What did they pay? What was built?
6. **Financial sketch** — Use AVM valuations and transaction comparables to estimate end values. Pull construction cost benchmarks from area data.

## Output format

```
## Development Feasibility: [address / BFE]

### Site Data
| Metric | Value |
|--------|-------|
| Land area | X m² |
| Current built area | X m² |
| Building density | X% (max: X%) |
| Current use | [BBR usage] |

### Zoning
- Zone: Byzone / Landzone / Sommerhusområde
- Local plan: [number/name]
- Allowed use: [residential / commercial / mixed]
- Max height: X m / X floors
- Max building density: X%
- Special restrictions: [if any]

### Buildable Potential
| Scenario | New m² | Total m² |
|----------|--------|---------|
| Max build-out | X | X |
| Conservative | X | X |

### Risk Factors
- [ ] Protected building / conservation area
- [ ] Contaminated land (jordforurening)
- [ ] Flood risk / coastal proximity
- [ ] Other encumbrances

### Market Reference
- Land transactions in area: X-X DKK/m²
- Construction cost estimate: X DKK/m² (benchmark)
- End sales price: X DKK/m² for new [type]

### Indicative Residual Land Value
| Line | Amount (DKK) |
|------|-------------|
| End value (X m² × X DKK/m²) | X |
| - Construction cost | (X) |
| - Developer profit (X%) | (X) |
| **Residual land value** | **X** |

### Verdict
[1-3 sentence feasibility read — go, no-go, needs rezoning, wait for plan change, etc.]
```
