# Development Feasibility

When a user has a development site or wants to assess what can be built on a property, run this analysis:

1. **Site overview** — Pull property details, current buildings, land area, building density (bebyggelsesprocent).
2. **Zoning analysis** — Local plan (lokalplan) overview. What does the municipal framework allow? Maximum building height, density, and usage.
3. **Buildable potential** — Based on zoning:
   - Max buildable m² = land area × allowed building density
   - Current built m² = existing buildings
   - Remaining potential = max - current
4. **Risk factors** — Protected buildings, conservation areas, contaminated land, coastal proximity, flood risk.
5. **Comparable projects** — Recent similar developments in the area. What did they build? What did construction cost?
6. **Quick financial sketch** — If the user provides or you can infer land value and construction costs:
   - Estimated construction cost (per m² benchmark)
   - Estimated end value (per m² comparable sales)
   - Residual land value = end value - construction cost - profit

## Output format

```
## Development Feasibility: [address/parcel]

### Site Data
| Metric | Value |
|--------|-------|
| Land area | X m² |
| Current built area | X m² |
| Building density | X% (max allowed: X%) |
| Current use | [residential/commercial/etc.] |

### Zoning
- Local plan: [number/name]
- Allowed use: [residential/commercial/mixed]
- Max height: X m / X floors
- Max building density: X%
- Special restrictions: [if any]

### Buildable Potential
| Scenario | New m² | Total m² |
|----------|--------|---------|
| Max build-out | X | X |
| Conservative (X%) | X | X |

### Risk Factors
- [ ] Protected building
- [ ] Conservation area
- [ ] Contamination risk
- [ ] Flood zone
- [ ] Other: ...

### Market Reference
- Recent comparable: [project] built [description] at ~X DKK/m² construction cost
- End sales: X DKK/m² for new build [type] in [area]

### Indicative Residual Land Value
(requires land acquisition cost and construction cost assumptions — note which are estimates)
| Line | Amount (DKK) |
|------|-------------|
| End value (X m² × X DKK) | X |
| - Construction cost (X m² × X DKK) | (X) |
| - Developer profit (X%) | (X) |
| **Residual land value** | **X** |

### Verdict
[1-3 sentence feasibility read — go, no-go, needs rezoning, etc.]
```
