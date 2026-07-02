import { defineTool } from "eve/tools";
import { z } from "zod";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const CATEGORY_COLORS: Record<string, string> = {
  ejendom: "#1e40af",
  virksomhed: "#166534",
  handel: "#c2410c",
  lejemål: "#7e22ce",
  poi: "#b45309",
  plan: "#0e7490",
};

const markerSchema = z.object({
  lat: z.number().describe("Latitude."),
  lng: z.number().describe("Longitude."),
  label: z.string().describe("Marker label."),
  description: z.string().optional().describe("Popup description shown on click."),
  color: z.string().optional().describe("Hex color for the marker dot."),
  category: z.string().optional().describe("Category for color-coding."),
  detail: z.string().optional().describe("Additional detail line in the popup."),
});

const cardSchema = z.object({
  title: z.string().describe("Card title/label."),
  value: z.string().describe("Card value (e.g. '5.2%', '3.2 mio kr')."),
  subtitle: z.string().optional().describe("Subtitle or context line."),
  color: z.string().optional().describe("Accent color for the card (hex). Default: #1e40af."),
});

const sectionSchema = z.object({
  type: z
    .enum(["heading", "text", "table", "cards", "chart", "map"])
    .describe("Section type."),
  level: z
    .number()
    .min(1)
    .max(4)
    .optional()
    .default(2)
    .describe("Heading level (1-4). Only for type: heading."),
  content: z
    .string()
    .optional()
    .describe("HTML content. Used for heading and text types."),
  headers: z
    .array(z.string())
    .optional()
    .describe("Column headers. Only for type: table."),
  rows: z
    .array(z.array(z.unknown()))
    .optional()
    .describe("Row data as array of arrays. Only for type: table."),
  cards: z
    .array(cardSchema)
    .optional()
    .describe("Metric cards. Only for type: cards."),
  chartType: z
    .enum(["bar", "horizontal_bar", "line", "pie", "scatter"])
    .optional()
    .describe("Chart type. Only for type: chart."),
  labels: z
    .array(z.string())
    .optional()
    .describe("Chart labels. Only for type: chart."),
  datasets: z
    .array(
      z.object({
        label: z.string(),
        values: z.array(z.number()),
        color: z.string().optional(),
      })
    )
    .optional()
    .describe("Chart datasets. Only for type: chart."),
  markers: z
    .array(markerSchema)
    .optional()
    .describe("Map markers. Only for type: map."),
  mapStyle: z
    .enum(["positron", "bright", "liberty", "dark", "fiord"])
    .optional()
    .default("positron")
    .describe("Map tile style. Only for type: map. Default: positron."),
  mapHeight: z
    .number()
    .optional()
    .default(400)
    .describe("Map height in pixels. Only for type: map."),
});

export default defineTool({
  description:
    "Build a complete, self-contained HTML artifact (report) composing multiple presentation elements: headings, text, tables, metric cards, charts, and maps. Writes a polished HTML file to output/ and returns the path + markdown summary. Use after pulling data and running calculations to assemble a professional report. The agent should populate sections using outputs from present_table, present_card, present_chart, and present_map.",
  inputSchema: z.object({
    title: z.string().describe("Report title displayed in the page header."),
    subtitle: z.string().optional().describe("Report subtitle (e.g. date range, property address)."),
    sections: z
      .array(sectionSchema)
      .describe("Ordered list of content sections in the report."),
    theme: z
      .enum(["blue", "slate", "green"])
      .optional()
      .default("blue")
      .describe("Color theme for the report header. Default: blue."),
    footer: z
      .string()
      .optional()
      .describe("Footer text (e.g. 'Source: Resights API · July 2026')."),
  }),
  async execute({ title, subtitle, sections, theme = "blue", footer }) {
    const themeColors: Record<string, { bg: string; text: string }> = {
      blue: { bg: "#1e40af", text: "#ffffff" },
      slate: { bg: "#1e293b", text: "#ffffff" },
      green: { bg: "#166534", text: "#ffffff" },
    };
    const tc = themeColors[theme];

    const sectionCounts: Record<string, number> = {};
    let mapIndex = 0;
    let chartIndex = 0;

    const sectionHtml = sections
      .map((s) => {
        switch (s.type) {
          case "heading":
            sectionCounts.heading = (sectionCounts.heading ?? 0) + 1;
            return renderHeading(s);
          case "text":
            sectionCounts.text = (sectionCounts.text ?? 0) + 1;
            return renderText(s);
          case "table":
            sectionCounts.table = (sectionCounts.table ?? 0) + 1;
            return renderTable(s);
          case "cards":
            sectionCounts.cards = (sectionCounts.cards ?? 0) + 1;
            return renderCards(s);
          case "chart":
            sectionCounts.chart = (sectionCounts.chart ?? 0) + 1;
            chartIndex++;
            return renderChart(s, chartIndex);
          case "map":
            sectionCounts.map = (sectionCounts.map ?? 0) + 1;
            mapIndex++;
            return renderMap(s, mapIndex);
          default:
            return "";
        }
      })
      .join("\n");

    const mapInitJs = generateMapInitJs(sections);

    const html = `<!DOCTYPE html>
<html lang="da">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<script src="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.js"></script>
<link href="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }
  .header { background: ${tc.bg}; color: ${tc.text}; padding: 32px 40px; }
  .header h1 { font-size: 26px; font-weight: 700; margin-bottom: 4px; }
  .header .subtitle { font-size: 14px; opacity: 0.8; }
  .content { max-width: 960px; margin: 0 auto; padding: 32px 24px; display: flex; flex-direction: column; gap: 28px; }
  .section-heading h2, .section-heading h3, .section-heading h4 { color: #0f172a; font-weight: 600; }
  .section-heading h2 { font-size: 22px; }
  .section-heading h3 { font-size: 18px; }
  .section-heading h4 { font-size: 16px; }
  .section-text { font-size: 15px; color: #334155; }
  .section-text p { margin-bottom: 8px; }
  .section-text ul, .section-text ol { margin: 8px 0 8px 20px; }
  .section-text li { margin-bottom: 4px; }
  .section-text strong { color: #0f172a; font-weight: 600; }
  .section-table { overflow-x: auto; }
  .section-table table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .section-table th { background: #f1f5f9; color: #475569; font-weight: 600; text-align: left; padding: 10px 14px; border-bottom: 2px solid #e2e8f0; }
  .section-table td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; }
  .section-table tr:last-child td { border-bottom: none; }
  .section-table tr:hover td { background: #f8fafc; }
  .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
  .metric-card { background: #ffffff; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04); border-left: 4px solid #1e40af; }
  .metric-card .card-title { font-size: 12px; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .metric-card .card-value { font-size: 24px; font-weight: 700; color: #0f172a; margin: 4px 0; }
  .metric-card .card-subtitle { font-size: 12px; color: #94a3b8; }
  .chart-container { background: #ffffff; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  .chart-container canvas { max-height: 350px; }
  .map-container { position: relative; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  .map-legend { position: absolute; bottom: 16px; left: 12px; background: rgba(255,255,255,0.93); padding: 8px 12px; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.12); font-size: 12px; z-index: 1; }
  .map-legend .legend-item { display: flex; align-items: center; gap: 5px; margin-top: 3px; }
  .map-legend .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .maplibregl-popup { max-width: 260px !important; }
  .maplibregl-popup-content { font-family: inherit; padding: 10px 12px; border-radius: 8px; font-size: 13px; }
  .popup-label { font-weight: 600; color: #1e293b; }
  .popup-desc { color: #475569; margin-top: 3px; }
  .popup-detail { color: #64748b; font-size: 12px; margin-top: 2px; }
  .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 13px; border-top: 1px solid #e2e8f0; margin-top: 16px; }
  @media print {
    body { background: #fff; }
    .header { background: #1e40af !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .content { max-width: 100%; padding: 20px; gap: 20px; }
    .card-grid { grid-template-columns: repeat(2, 1fr); }
    .chart-container { break-inside: avoid; }
    .map-container { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="header">
  <h1>${escapeHtml(title)}</h1>
  ${subtitle ? `<div class="subtitle">${escapeHtml(subtitle)}</div>` : ""}
</div>
<div class="content">
  ${sectionHtml}
</div>
${footer ? `<div class="footer">${escapeHtml(footer)}</div>` : ""}
<script>
${mapInitJs}
</script>
</body>
</html>`;

    const outputDir = join(process.cwd(), "output");
    mkdirSync(outputDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `report_${timestamp}.html`;
    const filePath = join(outputDir, filename);
    writeFileSync(filePath, html, "utf-8");

    const counts: string[] = [];
    for (const [type, n] of Object.entries(sectionCounts)) {
      counts.push(`${n} ${type}`);
    }

    const summary = [
      `## ${title}`,
      ``,
      `Rapport med ${sections.length} sektioner${counts.length ? " (" + counts.join(", ") + ")" : ""} — gemt som \`${filename}\`.`,
      ``,
      `Åbn \`${filePath}\` i din browser for at se den fulde rapport.`,
    ].join("\n");

    return {
      filePath,
      filename,
      html,
      markdown: summary,
      sectionCount: sections.length,
      sectionTypes: sectionCounts,
    };
  },
});

function renderHeading(s: { level?: number; content?: string }): string {
  const h = `h${Math.min(Math.max(s.level ?? 2, 1), 4)}`;
  return `<div class="section-heading"><${h}>${escapeHtml(s.content ?? "")}</${h}></div>`;
}

function renderText(s: { content?: string }): string {
  return `<div class="section-text">${s.content ?? ""}</div>`;
}

function renderTable(s: { headers?: string[]; rows?: unknown[][] }): string {
  const headers = s.headers ?? [];
  const rows = s.rows ?? [];
  if (headers.length === 0 && rows.length === 0) return "";
  const headerRow =
    headers.length > 0
      ? `<thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>`
      : "";
  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${formatCell(cell)}</td>`).join("")}</tr>`
    )
    .join("");
  return `<div class="section-table"><table>${headerRow}<tbody>${bodyRows}</tbody></table></div>`;
}

function renderCards(s: { cards?: { title: string; value: string; subtitle?: string; color?: string }[] }): string {
  const cards = s.cards ?? [];
  if (cards.length === 0) return "";
  const items = cards
    .map(
      (c) =>
        `<div class="metric-card" style="border-left-color:${c.color ?? "#1e40af"}">
          <div class="card-title">${escapeHtml(c.title)}</div>
          <div class="card-value" style="color:${c.color ?? "inherit"}">${escapeHtml(c.value)}</div>
          ${c.subtitle ? `<div class="card-subtitle">${escapeHtml(c.subtitle)}</div>` : ""}
        </div>`
    )
    .join("");
  return `<div class="card-grid">${items}</div>`;
}

function renderChart(
  s: { chartType?: string; labels?: string[]; datasets?: { label: string; values: number[]; color?: string }[] },
  index: number
): string {
  const labels = s.labels ?? [];
  const datasets = s.datasets ?? [];
  if (labels.length === 0 && datasets.length === 0) return "";

  const chartColors = ["#1e40af", "#0d9488", "#c2410c", "#7e22ce", "#b45309", "#166534", "#dc2626", "#2563eb"];

  const ds = datasets.map((d, i) => ({
    label: escapeJson(d.label),
    data: d.values,
    backgroundColor: d.color ?? chartColors[i % chartColors.length],
    borderColor: d.color ?? chartColors[i % chartColors.length],
    borderWidth: 1,
  }));

  const isHorizontal = s.chartType === "horizontal_bar";
  const configType = isHorizontal ? "bar" : (s.chartType ?? "bar");

  const config = {
    type: configType,
    data: { labels, datasets: ds },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: isHorizontal ? "y" : "x",
      plugins: {
        legend: { display: datasets.length > 1 || datasets[0]?.label !== "", position: "bottom" as const },
      },
      scales: configType === "pie" ? undefined : {
        x: configType === "bar" && isHorizontal ? undefined : { beginAtZero: true },
        y: configType === "bar" && isHorizontal ? { beginAtZero: true } : undefined,
      },
    },
  };

  return `<div class="chart-container"><canvas id="chart-${index}"></canvas></div>
<script>
new Chart(document.getElementById('chart-${index}').getContext('2d'), ${JSON.stringify(config)});
</script>`;
}

function renderMap(
  s: { markers?: { lat: number; lng: number; label: string; description?: string; detail?: string; color?: string; category?: string }[]; mapStyle?: string; mapHeight?: number },
  index: number
): string {
  const markers = s.markers ?? [];
  const height = s.mapHeight ?? 400;
  const style = s.mapStyle ?? "positron";

  const features = markers.map((m, i) => ({
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: [m.lng, m.lat] },
    properties: {
      id: i,
      label: m.label,
      description: m.description ?? "",
      detail: m.detail ?? "",
      color: m.color ?? CATEGORY_COLORS[m.category?.toLowerCase() ?? ""] ?? "#dc2626",
      category: m.category ?? "",
    },
  }));

  const categories = collectMapCategories(markers);
  const legendHtml =
    categories.length > 1
      ? `<div class="map-legend" id="map-legend-${index}">
          <strong>Signatur</strong>
          ${categories
            .map(
              (c) =>
                `<div class="legend-item"><span class="legend-dot" style="background:${c.color}"></span> ${escapeHtml(c.name)}</div>`
            )
            .join("")}
        </div>`
      : "";

  return `<div class="map-container">
    ${legendHtml}
    <div id="map-${index}" style="height:${height}px;width:100%"></div>
  </div>`;
}

function generateMapInitJs(sections: { type: string; markers?: { lat: number; lng: number; label: string; description?: string; detail?: string; color?: string; category?: string }[]; mapStyle?: string; mapHeight?: number }[]): string {
  const mapSections = sections.filter((s) => s.type === "map");
  if (mapSections.length === 0) return "";

  return mapSections
    .map((s, i) => {
      const index = i + 1;
      const markers = s.markers ?? [];
      const style = s.mapStyle ?? "positron";

      const features = markers.map((m, j) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [m.lng, m.lat] },
        properties: {
          id: j,
          label: m.label,
          description: m.description ?? "",
          detail: m.detail ?? "",
          color: m.color ?? CATEGORY_COLORS[m.category?.toLowerCase() ?? ""] ?? "#dc2626",
          category: m.category ?? "",
        },
      }));

      const bounds = computeMapBounds(markers);
      const initView = bounds
        ? `map${index}.fitBounds([[${bounds[0]}, ${bounds[1]}], [${bounds[2]}, ${bounds[3]}]], { padding: 40 })`
        : `map${index}.setCenter([10.0, 56.0]); map${index}.setZoom(7)`;

      return `
(function() {
  const map${index} = new maplibregl.Map({
    container: 'map-${index}',
    style: 'https://tiles.openfreemap.org/styles/${style}',
    center: [10.0, 56.0],
    zoom: 7,
    attributionControl: false
  });

  map${index}.on('load', function() {
    map${index}.addSource('markers-${index}', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: ${JSON.stringify(features)} }
    });

    map${index}.addLayer({
      id: 'marker-circles-${index}',
      type: 'circle',
      source: 'markers-${index}',
      paint: {
        'circle-radius': 6,
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9
      }
    });

    map${index}.addLayer({
      id: 'marker-labels-${index}',
      type: 'symbol',
      source: 'markers-${index}',
      layout: {
        'text-field': ['get', 'label'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 11,
        'text-offset': [0, 1.5],
        'text-anchor': 'top',
        'text-allow-overlap': false,
        'text-optional': true
      },
      paint: {
        'text-color': '#1e293b',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5
      }
    });

    ${initView}
  });

  map${index}.on('click', 'marker-circles-${index}', function(e) {
    var props = e.features[0].properties;
    var coords = e.features[0].geometry.coordinates.slice();
    var html = '<div class="popup-label">' + escapeHtml(props.label) + '</div>';
    if (props.description) html += '<div class="popup-desc">' + escapeHtml(props.description) + '</div>';
    if (props.detail) html += '<div class="popup-detail">' + escapeHtml(props.detail) + '</div>';
    if (props.category) html += '<div class="popup-detail" style="margin-top:5px;font-weight:500;color:' + props.color + '">\u25CF ' + escapeHtml(props.category) + '</div>';
    new maplibregl.Popup().setLngLat(coords).setHTML(html).addTo(map${index});
  });

  map${index}.on('mouseenter', 'marker-circles-${index}', function() { map${index}.getCanvas().style.cursor = 'pointer'; });
  map${index}.on('mouseleave', 'marker-circles-${index}', function() { map${index}.getCanvas().style.cursor = ''; });
})();`;
    })
    .join("\n");
}

function computeMapBounds(
  markers: { lat: number; lng: number }[]
): [number, number, number, number] | null {
  if (markers.length === 0) return null;
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const m of markers) {
    if (m.lng < minLng) minLng = m.lng;
    if (m.lng > maxLng) maxLng = m.lng;
    if (m.lat < minLat) minLat = m.lat;
    if (m.lat > maxLat) maxLat = m.lat;
  }
  if (markers.length === 1) {
    const pad = 0.02;
    return [minLng - pad, minLat - pad, maxLng + pad, maxLat + pad];
  }
  const padLng = Math.max((maxLng - minLng) * 0.1, 0.005);
  const padLat = Math.max((maxLat - minLat) * 0.1, 0.005);
  return [minLng - padLng, minLat - padLat, maxLng + padLng, maxLat + padLat];
}

function collectMapCategories(
  markers: { category?: string; color?: string }[]
): { name: string; color: string }[] {
  const seen = new Set<string>();
  const result: { name: string; color: string }[] = [];
  for (const m of markers) {
    const cat = m.category;
    if (!cat || seen.has(cat)) continue;
    seen.add(cat);
    result.push({
      name: cat,
      color: m.color ?? CATEGORY_COLORS[cat.toLowerCase()] ?? "#dc2626",
    });
  }
  return result;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return String(value);
  return escapeHtml(String(value));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJson(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
