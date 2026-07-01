# Investment Analysis

When a user is evaluating a potential real estate investment, run this analysis:

1. **Acquisition basis** — Purchase price, transaction costs (~0.6% + legal), total acquisition cost.
2. **Income analysis** — Current or potential rental income. Use Resights rental data to benchmark against area averages. Estimate per m² rent for each unit type.
3. **Operating expenses** — Property tax (ejendomsskat), land tax (grundskyld), insurance, maintenance, admin, vacancy allowance (estimate 3-5% unless user specifies).
4. **Financing** — If user provides LTV or loan terms, calculate debt service. Otherwise note that financing assumptions are needed.
5. **Key metrics** — Calculate and present:
   - Net operating income (NOI) = gross income - operating expenses
   - Cap rate (afkastgrad) = NOI / property value
   - Cash-on-cash return (if financing provided)
   - Gross yield = gross income / property value
6. **Sensitivity** — Show how the investment performs if rent drops 10% or if vacancy hits 10%.
7. **Comparables** — Pull recent transactions in the same area, same building type, to benchmark the asking price.

## Output format

```
## Investment Analysis: [address]

### Acquisition
| Line | Amount (DKK) |
|------|-------------|
| Purchase price | X |
| Transaction costs | X |
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
| Property tax | X |
| Land tax | X |
| Insurance | X |
| Maintenance | X |
| Admin | X |
| **Total operating expenses** | **X** |

### Key Metrics
- **NOI:** X DKK
- **Cap rate:** X.X%
- **Gross yield:** X.X%
- **Price per m²:** X DKK

### Market Benchmark
- Area avg per m²: X DKK (diff: +/- X%)
- Area avg rent per m²: X DKK (diff: +/- X%)

### Sensitivity
| Scenario | Cap rate | 
|----------|---------|
| Base case | X.X% |
| Rent -10% | X.X% |
| Vacancy 10% | X.X% |

### Verdict
[1-3 sentence investor takeaway]
```
