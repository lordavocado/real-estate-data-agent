# Property Due Diligence

When a user wants to evaluate a specific property, do a full investigation. Always discover tools first — never assume what endpoints are available.

## Step 1: Discover

Run `connection_search` with `"property"`, `"bfe"`, `"bbr"`, `"tinglysning"`, `"energy"`, and `"trade"` to find all relevant tools. You need tools for:
- Property details by BFE number
- BBR building and unit data
- Land registry documents (deeds, mortgages, easements)
- Energy labels
- Tax assessments
- Transaction history

## Step 2: Gather the data

Pull every data layer, one at a time, following IDs from each result:

1. **Core property data** — Get full property details by BFE. Note: property type (SFE/BPFG/CONDOMINIUM), land area, owners.
2. **BBR data** — Buildings, units (usage codes, areas, rooms), construction year, heating, energy supply. Check for renovation history.
3. **Ownership** — Who owns it? CVR or person? What's their share (tæller/nævner)?
4. **Tinglysning (land registry)** — Pull the deed documents (adkomster) showing purchase price, date, and transaction type. Pull mortgages (hæftelser) — rank by priority, note types (realkredit, ejerpantebrev, privat pantebrev), amounts, and creditors. Pull easements (servitutter) — look for restrictive covenants, lease agreements, rights of way, pre-emption rights.
5. **Valuations** — Current and historical tax assessments (VUR). Compare to any AVM prediction.
6. **Energy** — Energy label rating (A through G), consumption data, renovation recommendations.
7. **Transaction history** — Past sales: dates, prices, acquisition methods, price/m².
8. **Zoning** — Pull Plandata for applicable local plans and municipal framework.

## Step 3: Analyze red flags

As you review the data, flag these:

| Red flag | Why it matters |
|----------|---------------|
| Family transfer or related-party sale | Price may not reflect true market value |
| Many mortgages with high priority | Low equity — the owner may be over-leveraged |
| Old easements with vague wording | Could restrict development or use rights |
| Contaminated land marker (jordforurening) | Development or financing risk |
| Protected building status | Limits renovation and development |
| Short ownership period | Flipping? Check for hidden defects |
| Outdated tax assessment | May trigger reassessment and higher taxes |
| Low energy label (F-G) | Mandatory renovation may be required within 2 years of purchase |
| Mismatch between BBR and actual use | Could mean unpermitted construction |

## Step 4: Compare to market

Pull recent comparable transactions:
- Same property type
- Similar area (±30%)
- Same municipality or adjacent postal codes
- Arms-length sales only (Almindelig fri handel)
- Last 12-24 months

Compare: price/m², total price, and price trends.

## Output format

Use presentation tools rather than raw markdown:

- **`present_card`** for the Property Overview, Ownership, and Red Flags sections — key-value data with emphasis fields and status badges.
- **`present_table`** for Transaction History, Encumbrances, and Market Comparables tables.
- **`present_chart`** to visualize price trends or the property vs. market benchmark.
- **`present_map`** to show the property location with nearby comparables as markers.
- **`present_artifact`** to compose all sections into a single professional due diligence report — pass each section (heading, text, table, cards, chart, map) in order. Tell the user to open the file in their browser.
- **`present_card` + `present_chart` + `present_table`** for a completely custom dashboard layout (property card + mortgage waterfall + comparables map side-by-side).
