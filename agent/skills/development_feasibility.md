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

```
## Development Feasibility: [address / BFE]

### Site Data
| Metric | Value |
|--------|-------|
| Land area | X m² |
| Current built area | X m² |
| Current building density | X% |
| Max allowed density | X% |
| Current use | [BBR usage] |
| Zone | Byzone / Landzone / Sommerhusområde |

### Zoning Summary
- Local plan(s): [numbers/names]
- Framework: [municipal plan reference]
- Allowed uses: [residential / commercial / mixed / industrial]
- Max height: X m / X floors
- Max density: X%
- Parking requirement: X spaces per X m²
- Special restrictions: [list]

### Buildable Potential
| Scenario | New buildable m² | Units (residential) | GFA (commercial) |
|----------|-----------------|--------------------|--------------------|
| Max build-out | X | ~X | X |
| Conservative | X | ~X | X |

### Constraints & Risks
| Factor | Status | Impact |
|--------|--------|--------|
| Conservation area | Yes/No | — |
| Contaminated land | V1/V2/None | — |
| Flood risk | Yes/No | — |
| Noise zone | Yes/No/Partial | — |
| Protected nature | Yes/No | — |

### Market Reference
- Land transactions in area: X DKK/m² (range: X-X)
- Construction cost (estimate): X DKK/m²
- New-build end sales: X DKK/m²

### Indicative Residual Land Value
| Line | Amount |
|------|--------|
| End value (X m² × X DKK) | X DKK |
| - Construction cost | (X) DKK |
| - Soft costs (~12%) | (X) DKK |
| - Financing | (X) DKK |
| - Developer profit (~18%) | (X) DKK |
| **Residual land value** | **X DKK** |

### Verdict
[Feasibility assessment. Is the project viable at current land prices? What needs to change (rezoning, price, density) to make it work?]
```
