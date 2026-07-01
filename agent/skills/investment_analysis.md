# Investment Analysis

When a user is evaluating a potential real estate investment, run a full financial analysis using Resights data:

1. **Acquisition basis** — Purchase price or AVM valuation, transaction costs (~0.6% legal + 1.45% tinglysningsafgift), total acquisition cost.
2. **Income analysis** — Use Resights rental data to benchmark against area averages. Pull rental observations for similar properties in the same postal code/kommune.
3. **Operating expenses** — Property tax (ejendomsskat from VUR), land tax (grundskyld from VUR), insurance (estimate), maintenance (estimate), admin, vacancy allowance (3-5% unless user specifies).
4. **Financing** — If user provides LTV or loan terms, calculate debt service. Otherwise note assumptions are needed.
5. **Key metrics**:
   - NOI = gross income - operating expenses
   - Cap rate (afkastgrad) = NOI / property value
   - Cash-on-cash return (if financing)
   - Gross yield = gross income / property value
   - Price per m² vs. area benchmark
6. **Sensitivity** — Show base case, rent -10%, and vacancy 10% scenarios.
7. **Comparables** — Pull recent transactions in the same area of the same building type. Use Resights ES-style queries with geo filters.

## Output format

```
## Investment Analysis: [address]

### Acquisition
| Line | Amount (DKK) |
|------|-------------|
| Purchase price / AVM | X |
| Transaction costs (~2%) | X |
| **Total acquisition** | **X** |

### Income (annual)
| Line | Amount (DKK) |
|------|-------------|
| Gross rental income | X |
| - Vacancy (X%) | (X) |
| **Effective gross income** | **X** |

### Operating expenses (annual)
| Line | Amount (DKK) |
|------|-------------|
| Property tax (ejendomsskat) | X |
| Land tax (grundskyld) | X |
| Insurance | X |
| Maintenance | X |
| Admin | X |
| **Total operating expenses** | **X** |

### Key Metrics
| Metric | Value | Benchmark |
|--------|-------|-----------|
| NOI | X DKK | — |
| Cap rate | X.X% | Area avg: X.X% |
| Gross yield | X.X% | Area avg: X.X% |
| Price per m² | X DKK | Area avg: X DKK |

### Sensitivity
| Scenario | Cap rate | Cash-on-cash |
|----------|---------|-------------|
| Base case | X.X% | X.X% |
| Rent -10% | X.X% | X.X% |
| Vacancy 10% | X.X% | X.X% |

### Verdict
[1-3 sentence investor takeaway — is this deal above/below market? What's the risk-adjusted return?]
```
