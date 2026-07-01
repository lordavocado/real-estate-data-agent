# Ownership Tracing

When a user wants to know who really owns a property or company, trace the full ownership chain. Always discover tools first.

## Step 1: Discover

Run `connection_search` with `"cvr"`, `"network"`, `"graph"`, `"ejf"`, and `"owner"`. You need tools for:
- CVR company lookup
- Company network graph (ownership tree)
- Network expansion (multi-level tracing)
- Partners-in-crime (shared ownership)
- EJF person portfolio lookup
- Property search by owner CVR

## Step 2: Map the ownership chain

Start from the entity and work upward:

### Starting from a property
1. Pull property details → find the owner (CVR or person)
2. If CVR → pull the company's network graph. Key edge types:
   - **LEGAL_OWNERSHIP** — the legal (registered) owner
   - **REAL_OWNERSHIP** — the ultimate beneficial owner (reel ejer)
   - **CEO** — daglig ledelse
   - **DIRECTOR** — bestyrelsesmedlem
   - **AUDITS** — auditor
3. Expand the network multiple levels to find ultimate beneficial owners.
4. For each owning company found → repeat step 2-3.
5. If a person owner → pull their EJF portfolio to see all properties they own.

### Starting from a company
1. Pull the company's network graph immediately.
2. Trace LEGAL_OWNERSHIP and REAL_OWNERSHIP edges upward.
3. For each parent company, expand further.
4. Map siblings — other companies owned by the same parent.

## Step 3: Find related entities

Use `partners_in_crime` to discover:
- Other companies with shared owners/directors
- Co-owned properties
- Shared board members
- Common addresses

This reveals informal ownership groups that aren't visible through the formal CVR structure.

## Step 4: Map the full portfolio

For each entity in the ownership chain, search:
- Properties they own (property search by owner CVR)
- Companies they own (CVR network → children)
- Trades they've been involved in

## Step 5: Identify patterns

Look for:
- **Circular ownership** — A owns B owns A
- **Shell companies** — Holding companies with no operations, only property
- **Foreign ownership** — Ultimate owner outside Denmark
- **Concentration** — One person/group controls many entities
- **Fragmentation** — Property owned through many layers (tax/liability structuring)

## Output format

```
## Ownership Structure: [property/company name]

### Direct Owner
- **[Name/CVR]**
- Type: Person / Company / Foreign entity
- Ownership share: X/Y (X%)
- Address: [if available]

### Ownership Chain
[ASCII tree view]

🏢 Ejendom ApS (CVR 12345678) — 100%
├── 🏢 Holding ApS (CVR 87654321) — 100%
│   └── 👤 Anders Jensen — reel ejer
└── 👤 [Name withheld] — 0% (director only)

### Ultimate Beneficial Owners
| Entity | Type | Ownership level | Direct/Indirect |
|--------|------|----------------|-----------------|
| Anders Jensen | Person | Level 2 (via Holding ApS) | Indirect 100% |

### Related Entities (Partners in Crime)
| Entity | Relation | Shared with |
|--------|---------|------------|
| Ejendom2 ApS | Shared owner | Anders Jensen |
| BoligDrift ApS | Shared director | Lars Nielsen |

### Portfolio Overview
Entities connected to this ownership group:
| Entity | Type | Properties owned | Total m² |
|--------|------|-----------------|---------|
| Holding ApS | Company | 12 | 8,400 |
| Ejendom ApS | Company | 3 | 1,200 |
| Anders Jensen | Person | 5 | 2,800 |
| **Total group** | — | **20** | **12,400** |

### Geographic Concentration
| Municipality | Properties | m² |
|-------------|-----------|-----|
| København | 14 | 9,200 |
| Gentofte | 6 | 3,200 |

### Structural Observations
[1-3 sentences: any notable patterns, complexity, foreign elements, or transparency concerns.]
```
