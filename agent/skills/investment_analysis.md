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

## Step 3: Calculate

Use the built-in calculation tools — don't calculate manually:

- **`calculate_cap_rate`** — NOI, cap rate, gross/net yield from rent, vacancy, taxes, and expenses. Pass the rent from Step 2 and the property value/AVM.
- **`calculate_acquisition_cost`** — Total purchase cost including tinglysningsafgift (1.45% + 1.850 kr), legal fees (0.6%), and optional mortgage setup.
- **`calculate_mortgage`** — If financed: monthly payments for Danish realkreditlån (annuity, serial, interest-only) with bidrag and tax deduction.
- **`calculate_roi`** — Full investment analysis with 4 sensitivity scenarios (rent ±10%, vacancy +10%, worst case). Feed the NOI and costs from the above tools.

Chain them: `calculate_cap_rate` → `calculate_acquisition_cost` → `calculate_mortgage` (if financed) → `calculate_roi`.

## Step 4: Present

Use presentation tools to format the results:

- **`present_card`** for the property overview with key facts and red flag badges.
- **`present_table`** for the comparable sales list, expense breakdown, and sensitivity scenarios.
- **`present_chart`** to visualize rent benchmarks, price trends in the area, or sensitivity outcomes.
- **`present_artifact`** to compose everything into a professional investment report — combine the card, tables, and charts into sections. Tell the user to open the file in their browser.
- **`present_card` + `present_chart` + `present_table`** for a fully custom investment dashboard with metrics, charts, and tables in a bespoke layout.

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
