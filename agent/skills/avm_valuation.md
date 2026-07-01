# AVM Valuation

When a user wants an automated property valuation, use the Resights AVM (Automated Valuation Model):

1. **Get AVM prediction** — Call the property AVM endpoint by BFE number. Returns CatBoost, LGBM, and KNN ensemble predictions.
2. **Check accuracy** — Review the variation coefficient and prediction bounds. Higher variation = less certainty.
3. **Review neighbors** — The AVM returns nearest neighbor properties used in the comparison. List them with addresses.
4. **Compare to VUR** — Pull the latest public tax assessment (offentlig vurdering) and compare to AVM.
5. **Compare to transactions** — If the property has recent trades, compare AVM to actual sale price.
6. **Benchmark** — Compare the AVM per m² to area averages for the same property type.

## Output format

```
## AVM Valuation: [address]

### Prediction Summary
| Model | Price/m² | Total Price |
|-------|---------|-------------|
| CatBoost | X DKK | X DKK |
| LGBM | X DKK | X DKK |
| KNN | X DKK | X DKK |
| **Ensemble** | **X DKK** | **X DKK** |

### Confidence
- Variation coefficient: X%
- Price range (KNN bounds): X - X DKK
- Accuracy @ 5%: X%
- Accuracy @ 10%: X%

### Nearest Neighbors Used
| BFE | Address | Floor Area | Price/m² |
|-----|---------|-----------|---------|
| ... | ... | ... | ... |

### Comparison to Other Valuations
| Source | Value | Date | Diff vs AVM |
|--------|-------|------|------------|
| AVM ensemble | X DKK | today | — |
| Latest VUR | X DKK | year | +/- X% |
| Last trade | X DKK | date | +/- X% |

### Market Context
- Area avg price/m²: X DKK
- AVM vs area avg: +/- X%

### Verdict
[1-2 sentence interpretation — is the AVM reasonable given comparables and market context?]
```
