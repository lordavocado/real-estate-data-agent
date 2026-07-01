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

```
## Due Diligence: [address], BFE [number]

### Property Overview
| Metric | Value |
|--------|-------|
| Property type | SFE / BPFG / Condominium |
| Land area | X m² |
| Building area | X m² |
| Buildings | X |
| Construction year | year |
| Usage | [BBR code + description] |
| Energy label | A-G |

### Ownership
| Owner | Type | Share | Since |
|-------|------|-------|-------|
| [name] | Person/CVR | X/Y | date |

### Transaction History
| Date | Price | Price/m² | Type |
|------|-------|---------|------|
| ... | ... DKK | ... DKK | ... |

**Latest sale**: [interpretation — arms-length? family? related-party?]

### Valuations
| Source | Value | Date |
|--------|-------|------|
| Latest VUR | X DKK | year |
| AVM prediction | X DKK | — |
| Land value | X DKK | year |

### Encumbrances
| Type | Priority | Amount | Creditor |
|------|---------|--------|----------|
| [Realkredit/Ejerpantebrev/Privat] | 1 | X DKK | [name] |
| ... | ... | ... | ... |

**Total secured debt**: X DKK
**Equity (latest price - debt)**: X DKK

### Easements (key)
- [type]: [summary]

### Red Flags
- [ ] Issue: [explanation]
- [ ] Issue: [explanation]

### Market Comparables
| Address | Date | Price | Price/m² | Area |
|---------|------|-------|---------|------|
| ... | ... | ... | ... | ... |

**Comparable median**: X DKK/m²
**Subject property**: X DKK/m²
**Difference**: ±X%

### Verdict
[2-4 sentence bottom line: clean title or messy? Any deal-breakers? Fair price relative to market?]
```
