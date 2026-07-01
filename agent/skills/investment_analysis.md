# Investment Analysis

When a user is evaluating a real estate investment, run a full financial analysis. Always discover tools first.

## Step 1: Discover

Run `connection_search` with `"property"`, `"trade"`, `"rental"`, and `"vur"` or `"tax"`. You need tools to:
- Get the subject property's details and size
- Pull comparable sales for price benchmarking
- Pull rental data for income estimates
- Pull tax assessments for cost estimates

## Step 2: Gather inputs

Pull the following from the API, then fill in estimates where data is missing:

### From the API
- **Property details** — area (m²), type, construction year, energy label, usage
- **Trade comparables** — recent arms-length sales of similar properties nearby
- **Rental comparables** — market rent per m² for similar units in the same area
- **Tax assessment (VUR)** — property tax and land tax basis
- **AVM valuation** — automated price estimate if available

### Estimates (note these clearly)
- Transaction costs: ~0.6% legal fees + 1.45% registration fee (tinglysningsafgift) + 1,850 DKK
- Insurance: ~2-5 DKK/m²/month for residential, higher for commercial
- Maintenance: ~100-200 DKK/m²/year for residential, higher for older buildings
- Administration: ~3-5% of gross rent if professionally managed
- Vacancy: 3-5% for residential in Copenhagen/Aarhus, higher elsewhere

## Step 3: Calculate key metrics

### Net Operating Income (NOI)
```
Gross rental income
- Vacancy allowance (X%)
- Property tax (ejendomsskat)
- Land tax (grundskyld)
- Insurance
- Maintenance
- Administration
= NOI
```

### Return metrics
```
Cap rate (afkastgrad)  = NOI / property value
Gross yield             = gross rent / property value
Price per m²            = property value / building area
Rent per m²             = annual rent / building area
```

### If financing is provided
```
Annual debt service
Cash flow before tax = NOI - debt service
Cash-on-cash return  = cash flow / equity invested
```

## Step 4: Run sensitivity

Show how the investment performs under different assumptions:

| Scenario | Assumption | Cap rate | Cash-on-cash |
|----------|-----------|---------|-------------|
| Base case | Current rent, 3% vacancy | X.X% | X.X% |
| Rent down | Rent -10% | X.X% | X.X% |
| Rent up | Rent +10% | X.X% | X.X% |
| High vacancy | Vacancy 10% | X.X% | X.X% |
| Worst case | Rent -10%, vacancy 10% | X.X% | X.X% |

## Output format

```
## Investment Analysis: [address]

### Property
| Metric | Value |
|--------|-------|
| Type | [SFE/Ejerlejlighed/Commercial] |
| Area | X m² |
| Year built | XXXX |
| Price / AVM | X DKK |

### Acquisition Costs
| Line | Amount |
|------|--------|
| Purchase price | X DKK |
| Legal fees (~0.6%) | X DKK |
| Registration (1.45% + 1,850) | X DKK |
| **Total acquisition** | **X DKK** |

### Income (annual)
| Line | Amount |
|------|--------|
| Gross rent (X kr/m² × X m²) | X DKK |
| - Vacancy (X%) | (X) DKK |
| **Effective gross income** | **X DKK** |

### Operating Expenses (annual)
| Line | Amount | Note |
|------|--------|------|
| Property tax | X DKK | from VUR |
| Land tax | X DKK | from VUR |
| Insurance | X DKK | estimated |
| Maintenance | X DKK | estimated |
| Administration | X DKK | estimated |
| **Total expenses** | **X DKK** |

### Key Metrics
| Metric | Value | Market benchmark |
|--------|-------|-----------------|
| NOI | X DKK | — |
| Cap rate | X.X% | Area avg: X.X% |
| Gross yield | X.X% | Area avg: X.X% |
| Price per m² | X DKK | Area avg: X DKK |
| Rent per m² | X DKK | Area avg: X DKK |

### Sensitivity
| Scenario | Cap rate |
|----------|---------|
| Base case | X.X% |
| Rent -10% | X.X% |
| Vacancy 10% | X.X% |
| Worst case | X.X% |

### Verdict
[1-3 sentence investor takeaway. Is this a core, value-add, or opportunistic play? Does the return compensate for the risk? How does it compare to area benchmarks?]
```
