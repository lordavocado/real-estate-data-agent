# AVM Valuation

When a user wants an automated property valuation, use the connected AVM endpoints. Always discover tools first.

## Step 1: Discover

Run `connection_search` with `"avm"`, `"valuation"`, `"vurdering"`, and `"prediction"`. The AVM endpoint provides:
- Three-model ensemble: CatBoost, LightGBM (LGBM), and K-Nearest Neighbors (KNN)
- Confidence metrics: variation coefficient, prediction bounds, accuracy at 5/10/20%
- Nearest neighbor properties used in the comparison

## Step 2: Pull the AVM prediction

Call the AVM tool with the BFE number. The response contains:

**Model predictions (all per m²):**
- `catboost_sqm_price_prediction` — gradient boosting model
- `lgbm_sqm_price_prediction` — LightGBM model
- `knn_sqm_price_prediction` — K-nearest neighbors model
- `sqm_price_building_area_prediction` — ensemble prediction
- `trade_price_prediction` — total price prediction

**Confidence:**
- `variation_coefficient` — lower = more confident (typically 0.05-0.25)
- `knn_lower_prediction_bound` / `knn_upper_prediction_bound` — 95% confidence range
- `knn_variation_coefficient` — KNN model uncertainty

**Neighbors:**
- List of BFE numbers and addresses used as comparables

## Step 3: Validate the prediction

Don't just present the number — validate it:

1. **Check the variation coefficient** — below 0.10 is tight, 0.10-0.20 is moderate, above 0.20 is uncertain. High variation means the models disagree significantly, often because the property is unusual or there are few comparables.
2. **Review the neighbors** — are they truly comparable? Same property type? Similar area? Same neighborhood? If the AVM is comparing a villa in Hellerup to a villa in Hundige, flag the mismatch.
3. **Compare to VUR** — pull the latest tax assessment. Big divergence may signal either an inaccurate model or an outdated assessment.
4. **Compare to actual trades** — if the property sold recently, how does the AVM compare to the actual sale price?
5. **Benchmark against area** — search comparable transactions to see if the AVM aligns with real market activity.

## Step 4: Interpret for the user

The AVM is a statistical estimate, not a guarantee. Help the user understand:

- **Range, not point** — present the KNN bounds (lower and upper) as the realistic price range.
- **When to trust it** — low variation coefficient + tight prediction bounds + good comparables = reliable.
- **When to be skeptical** — high variation + few/weak neighbors + unique property = treat as directional only.
- **AVM vs. actual market** — the AVM is based on historical data. In a fast-moving market, actual bids may differ significantly.

## Output format

Use presentation tools:

- **`present_card`** for the Ensemble Prediction and Confidence Assessment — key-value data with emphasis on the predicted price and variation coefficient.
- **`present_table`** for the Model Breakdown and Nearest Neighbors — column formatting for currency and area.
- **`present_chart`** (bar or scatter) to visualize the three model predictions against each other or the prediction bounds.
- **`present_artifact`** for a full valuation report combining card + tables + chart into one HTML file.
- **`present_card` + `present_chart` + `present_table`** for a custom valuation dashboard with prediction gauge, neighbor map, and confidence indicators.
