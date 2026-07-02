# Reporting & Presentation

When you have pulled data and run calculations, you must present results visually — never dump raw JSON. This skill guides you on WHICH presentation tool to use for each situation.

## Tool decision guide

### Single entity summary → `present_card`
Use when you have one entity (property, company, person) and want to show its key facts. Supports sections for grouped data, emphasis fields for important numbers, and severity badges.
- Example: property overview, company profile, valuation summary.

### Lists and comparisons → `present_table`
Use when you have multiple rows of structured data. Supports column formatting: currency (DKK/EUR), area (m²), percentage, date, number.
- Example: comparable sales, expense breakdown, rental listings, company search results.

### Trends and distributions → `present_chart`
Use when data benefits from visual comparison over time or across categories. Supports bar, line, pie, scatter, and horizontal bar. Renders inline in the chat UI.
- Example: price trends over years, rent distribution by area, revenue comparison across companies.

### Geospatial data → `present_map`
Use when data has coordinates and the user needs geographic context. Markers support labels and detail lines. Renders inline in the chat UI.
- Example: property locations, comparable sales on a map, portfolio overview, area analysis with POI markers.

### Full downloadable report → `present_artifact`
Use when you need a professional, multi-section HTML report saved to `output/`. Sections: heading, text, table, cards, chart, map. Tell the user to open the file in their browser.
- Use for: due diligence reports, investment analyses, market research dossiers.

## When to compose vs. show individually

| Situation | Use |
|-----------|-----|
| Quick lookup, one entity | `present_card` |
| List of results, no analysis needed | `present_table` |
| Trend or comparison visually | `present_chart` |
| Map for geographic context | `present_map` |
| Full analysis with multiple data layers (inline) | Chain `present_card` + `present_chart` + `present_table` + `present_map` |
| Full analysis as downloadable HTML | `present_artifact` |

## Composition workflow

1. **Pull data** via Resights API connection tools
2. **Calculate** via `calculate_cap_rate`, `calculate_mortgage`, `calculate_acquisition_cost`, `calculate_roi`
3. **Present inline** — call `present_card`, `present_table`, `present_chart`, and/or `present_map` as needed. Each renders in the chat.
4. **Optional HTML export** — use `present_artifact` when the user needs a shareable report file.

## File output

`present_artifact` (and `present_map` when it writes HTML) may save files under `output/`. When they do:
1. Pass the `filePath` from the tool response to the user
2. Tell them: "Åbn `{filePath}` i din browser for den fulde rapport."
3. Still include inline presentation tools so the user sees results in chat
