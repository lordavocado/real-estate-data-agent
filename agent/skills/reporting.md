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
Use when data benefits from visual comparison over time or across categories. Supports bar, line, pie, scatter, and horizontal bar. The chart renders as an inline image in chat via QuickChart.io. Also returns structured data for frontend rendering.
- Example: price trends over years, rent distribution by area, revenue comparison across companies.

### Geospatial data → `present_map`
Use when data has coordinates and the user needs geographic context. Markers support labels, descriptions, categories (auto-colored), and detail lines. A static preview renders inline in chat. The full interactive map (with clickable markers and popups) is written to a file.
- Example: property locations, comparable sales on a map, portfolio overview, area analysis with POI markers.

### Full report → `present_artifact`
Use when you need a professional, multi-section report. Sections: heading, text (HTML), table (headers+rows), cards (metric/value), chart (bar/line/pie/scatter), map (markers). The output is a self-contained HTML file — tell the user to open it.
- Use for: due diligence reports, investment analyses, market research, development feasibility, ownership tracing dossiers.

### Custom dashboard → `present_ui`
Use when you need a bespoke layout that doesn't fit the standard artifact sections. You generate a json-render spec (flat elements tree) and the tool renders it as interactive HTML. Supports 15 components: Card, Stack, Grid, Heading, Text, Badge, Separator, Metric, Table, BarChart, LineChart, PieChart, Progress, List, MapView.
- Use for: custom investment dashboards, property overviews with mixed layouts, side-by-side comparisons, any UI where you need creative control over arrangement. Bind data via `{ "$state": "/path/to/value" }` in component props.

## When to compose vs. show individually

| Situation | Use |
|-----------|-----|
| Quick lookup, one entity | `present_card` |
| List of results, no analysis needed | `present_table` |
| Trend or comparison visually | `present_chart` |
| Map for geographic context | `present_map` |
| Full analysis with multiple data layers | `present_artifact` |
| Creative, bespoke layout needed | `present_ui` |

## Composition workflow

When building a `present_artifact` or `present_ui`, chain tools:

1. **Pull data** via Resights API connection tools
2. **Calculate** via `calculate_cap_rate`, `calculate_mortgage`, `calculate_acquisition_cost`, `calculate_roi`
3. **Present via artifact** — populate sections from the outputs of step 1 and 2:

For `present_artifact`:
```
Section types:
- heading → report headings/section titles
- text → interpretation text, disclaimers, source notes
- table → pass rows from API results or calculation outputs
- cards → pass metric cards (value, label, color)
- chart → pass chart config (labels, datasets)
- map → pass marker array with lat/lng/label/category
```

For `present_ui`:
```
Components available:
- Card (title, children) — container for sections
- Stack (direction: "row"/"column", gap) — flex layout
- Grid (columns: 2-4) — CSS grid
- Heading (text, level: 1-4)
- Text (text, variant: "body"/"lead"/"caption")
- Badge (text, variant: "positive"/"negative"/"neutral"/"info"/"warning")
- Separator
- Metric (label, value, change, changeType)
- Table (columns: string[], rows: unknown[][], caption)
- BarChart/LineChart/PieChart (labels, datasets, direction)
- Progress (value, max, label)
- List (items: [{icon, text, description}])
- MapView (markers, mapStyle: "positron"/"bright"/"liberty"/"dark"/"fiord", height)
```

## File output

All `present_map`, `present_artifact`, and `present_ui` tools write self-contained HTML files to `output/`. Always:
1. Pass the `filePath` from the tool response to the user
2. Tell them: "Åbn `{filePath}` i din browser for at se det interaktive [kort/rapport/dashboard]."
3. Include the markdown summary in your chat response so the user sees a preview before opening the file
