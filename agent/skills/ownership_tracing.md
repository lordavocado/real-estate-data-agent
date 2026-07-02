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

Use presentation tools:

- **`present_card`** for each entity in the ownership chain — title (name/CVR), sections for financials, members, and properties. Use badges for entity type and risk flags.
- **`present_table`** for the Portfolio Overview and Geographic Concentration tables.
- **`present_map`** with markers for all properties in the portfolio, color-coded by entity.
- **`present_chart`** (horizontal bar) to show property distribution by municipality or m² concentration.
- **`present_artifact`** to compose the full ownership report with cards, tables, map, and chart into one HTML file.
- **`present_card` + `present_chart` + `present_table`** for a custom network-style layout with entity cards arranged in a grid, property map below, and concentration chart.
