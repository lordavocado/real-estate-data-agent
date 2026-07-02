import { defineTool } from "eve/tools";
import { z } from "zod";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const MAP_CATEGORY_COLORS: Record<string, string> = {
  ejendom: "#1e40af",
  virksomhed: "#166534",
  handel: "#c2410c",
  lejemål: "#7e22ce",
  poi: "#b45309",
  plan: "#0e7490",
};

const elementPropsSchema = z.record(z.string(), z.unknown()).describe("Component props as key-value object.");

const elementSchema = z.object({
  type: z.string().describe("Component type from the supported catalog."),
  props: elementPropsSchema.optional().default({}),
  children: z.array(z.string()).optional().default([]).describe("Child element key references."),
  visible: z.record(z.string(), z.unknown()).optional().describe("Conditional visibility expression."),
});

export default defineTool({
  description:
    "Generate a unique, custom UI from a json-render spec (flat elements tree with root + elements). Renders to a self-contained HTML file with interactive charts (Chart.js), maps (OpenFreeMap), and styled components. Use when you need a bespoke dashboard, property overview card, investment summary, or any UI that doesn't fit the standard table/card/chart/map patterns. You (the agent) generate the spec JSON — the tool converts it to visual HTML.\n\n**Supported components:** Card, Stack (flex layout), Grid (CSS grid), Heading (h1-h4), Text (paragraph), Badge, Separator, Metric (KPI stat), Table (data table), BarChart, LineChart, PieChart, Progress, List (icon+text items), MapView (OpenFreeMap markers).\n\n**Data binding:** Use `{ \"$state\": \"/path/to/value\" }` in props to reference values from the `data` object. Pass all dynamic values in the `data` parameter.",
  inputSchema: z.object({
    title: z.string().describe("Page title displayed in the browser tab and header."),
    root: z.string().describe("Key of the root element (e.g. 'card-1')."),
    elements: z.record(z.string(), elementSchema).describe("Flat map of element keys to element definitions."),
    data: z
      .record(z.string(), z.unknown())
      .optional()
      .default({})
      .describe("Data object for $state bindings. Keys are root paths (e.g. 'metrics', 'tableData')."),
    theme: z
      .enum(["blue", "slate", "green"])
      .optional()
      .default("blue")
      .describe("Color theme. Default: blue."),
    height: z
      .number()
      .optional()
      .default(600)
      .describe("Map height in pixels when a MapView is present."),
  }),
  async execute({ title, root, elements, data = {}, theme = "blue", height = 600 }) {
    const themeColors: Record<string, { bg: string }> = {
      blue: { bg: "#1e40af" },
      slate: { bg: "#1e293b" },
      green: { bg: "#166534" },
    };
    const tc = themeColors[theme];

    let hasChart = false;
    let hasMap = false;
    let chartScripts = "";
    let mapScripts = "";

    function renderElement(key: string, depth: number = 0): string {
      const el = elements[key];
      if (!el) return "";

      if (el.visible && !checkVisible(el.visible, data)) return "";

      const props = el.props || {};
      const resolved = resolveProps(props, data);
      const kids = (el.children || []).map((k) => renderElement(k, depth + 1)).join("");

      switch (el.type) {
        case "Card":
          return renderCard(resolved, kids);
        case "Stack":
          return renderStack(resolved, kids);
        case "Grid":
          return renderGrid(resolved, kids);
        case "Heading":
          return renderHeading(resolved);
        case "Text":
          return renderTextBlock(resolved);
        case "Badge":
          return renderBadge(resolved);
        case "Separator":
          return `<hr class="jr-separator">`;
        case "Metric":
          return renderMetric(resolved);
        case "Table":
          return renderJTable(resolved);
        case "BarChart":
          hasChart = true;
          chartScripts += generateChartScript(resolved, "bar", key);
          return renderChartContainer(key);
        case "LineChart":
          hasChart = true;
          chartScripts += generateChartScript(resolved, "line", key);
          return renderChartContainer(key);
        case "PieChart":
          hasChart = true;
          chartScripts += generateChartScript(resolved, "pie", key);
          return renderChartContainer(key);
        case "Progress":
          return renderProgress(resolved);
        case "List":
          return renderList(resolved);
        case "MapView":
          hasMap = true;
          mapScripts += generateMapScript(resolved, key);
          return renderMapContainer(key, resolved, height);
        default:
          return `<div class="jr-unknown">Unknown: ${escapeHtml(el.type)}${kids}</div>`;
      }
    }

    const bodyHtml = renderElement(root);

    const html = buildPage({ title, tc, bodyHtml, hasChart, hasMap, chartScripts, mapScripts });

    const outputDir = join(process.cwd(), "output");
    mkdirSync(outputDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `ui_${timestamp}.html`;
    const filePath = join(outputDir, filename);
    writeFileSync(filePath, html, "utf-8");

    const elementCount = Object.keys(elements).length;
    const summary = [
      `## ${title}`,
      ``,
      `Custom UI med **${elementCount} elementer** — gemt som \`${filename}\`.`,
      ``,
      `Åbn \`${filePath}\` i din browser for at se den interaktive visning.`,
    ].join("\n");

    return {
      filePath,
      filename,
      html,
      markdown: summary,
      elementCount,
      root,
      elements,
      data,
      title,
    };
  },
});

function resolveProps(props: Record<string, unknown>, data: Record<string, unknown>): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    resolved[k] = resolveValue(v, data);
  }
  return resolved;
}

function resolveValue(value: unknown, data: Record<string, unknown>): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if ("$state" in obj && typeof obj.$state === "string") {
      return getFromData(data, obj.$state);
    }
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      resolved[k] = resolveValue(v, data);
    }
    return resolved;
  }
  if (Array.isArray(value)) {
    return value.map((v) => resolveValue(v, data));
  }
  return value;
}

function getFromData(data: Record<string, unknown>, path: string): unknown {
  const parts = path.replace(/^\//, "").split("/");
  let current: unknown = data;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function checkVisible(visible: Record<string, unknown>, data: Record<string, unknown>): boolean {
  const statePath = visible.$state as string | undefined;
  if (!statePath) return true;
  const val = getFromData(data, statePath);
  const eq = visible.eq;
  if (eq !== undefined) return val === eq;
  return val !== null && val !== undefined && val !== false && val !== 0 && val !== "";
}

const VARIANT_COLORS: Record<string, string> = {
  positive: "#166534",
  negative: "#dc2626",
  neutral: "#64748b",
  info: "#1e40af",
  warning: "#b45309",
};

function renderCard(p: Record<string, unknown>, children: string): string {
  const title = p.title && p.title !== "" ? `<div class="jr-card-header">${escapeHtml(String(p.title))}</div>` : "";
  const maxW = p.maxWidth ? ` max-width:${p.maxWidth}px;` : "";
  return `<div class="jr-card" style="${maxW}">${title}<div class="jr-card-body">${children}</div></div>`;
}

function renderStack(p: Record<string, unknown>, children: string): string {
  const direction = p.direction === "row" ? "row" : "column";
  const gap = gapClass(p.gap);
  const align = p.align ? ` align-items:${p.align};` : "";
  const justify = p.justify ? ` justify-content:${p.justify};` : "";
  return `<div class="jr-stack" style="flex-direction:${direction};${align}${justify}${gap === "md" ? " gap:16px;" : gap === "lg" ? " gap:24px;" : gap === "sm" ? " gap:8px;" : " gap:12px;"}">${children}</div>`;
}

function renderGrid(p: Record<string, unknown>, children: string): string {
  const cols = typeof p.columns === "number" ? p.columns : 2;
  const gap = gapClass(p.gap);
  return `<div class="jr-grid" style="grid-template-columns:repeat(${cols}, 1fr);${gap === "md" ? " gap:16px;" : gap === "lg" ? " gap:24px;" : gap === "sm" ? " gap:8px;" : " gap:12px;"}">${children}</div>`;
}

function renderHeading(p: Record<string, unknown>): string {
  const text = escapeHtml(String(p.text ?? ""));
  const level = typeof p.level === "number" ? Math.min(Math.max(p.level, 1), 4) : 2;
  return `<${"h" + level} class="jr-heading jr-h${level}">${text}</${"h" + level}>`;
}

function renderTextBlock(p: Record<string, unknown>): string {
  const text = String(p.text ?? "");
  const variant = typeof p.variant === "string" ? p.variant : "body";
  const cls = variant === "caption" ? "jr-text-caption" : variant === "lead" ? "jr-text-lead" : "jr-text";
  return `<p class="${cls}">${escapeHtml(text)}</p>`;
}

function renderBadge(p: Record<string, unknown>): string {
  const text = escapeHtml(String(p.text ?? ""));
  const variant = typeof p.variant === "string" ? p.variant : "neutral";
  const color = VARIANT_COLORS[variant] ?? VARIANT_COLORS.neutral;
  return `<span class="jr-badge" style="background:${color}15;color:${color};border:1px solid ${color}30">${text}</span>`;
}

function renderMetric(p: Record<string, unknown>): string {
  const label = escapeHtml(String(p.label ?? ""));
  const value = escapeHtml(String(p.value ?? "—"));
  const change = p.change ? escapeHtml(String(p.change)) : "";
  const changeType = typeof p.changeType === "string" ? p.changeType : "neutral";
  const changeColor = VARIANT_COLORS[changeType] ?? VARIANT_COLORS.neutral;
  const changeHtml = change
    ? `<span class="jr-metric-change" style="color:${changeColor}">${changeType === "positive" ? "↑" : changeType === "negative" ? "↓" : "→"} ${change}</span>`
    : "";
  return `<div class="jr-metric">
    <div class="jr-metric-label">${label}</div>
    <div class="jr-metric-value">${value}</div>
    ${changeHtml}
  </div>`;
}

function renderJTable(p: Record<string, unknown>): string {
  const columns = Array.isArray(p.columns) ? (p.columns as string[]) : [];
  const rows = Array.isArray(p.rows) ? (p.rows as unknown[][]) : [];
  const caption = p.caption ? `<caption>${escapeHtml(String(p.caption))}</caption>` : "";
  if (columns.length === 0) return "";
  const thead = `<thead><tr>${columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${formatTableCell(cell)}</td>`).join("")}</tr>`
    )
    .join("")}</tbody>`;
  return `<div class="jr-table-wrapper"><table>${caption}${thead}${tbody}</table></div>`;
}

function renderProgress(p: Record<string, unknown>): string {
  const val = typeof p.value === "number" ? Math.min(100, Math.max(0, p.value)) : 0;
  const label = p.label ? escapeHtml(String(p.label)) : "";
  const max = typeof p.max === "number" ? p.max : 100;
  const pct = max > 0 ? Math.round((val / max) * 100) : 0;
  const color = pct > 80 ? "#dc2626" : pct > 50 ? "#b45309" : "#166534";
  return `<div class="jr-progress">
    ${label ? `<div class="jr-progress-label">${label} <span>${pct}%</span></div>` : ""}
    <div class="jr-progress-track"><div class="jr-progress-fill" style="width:${pct}%;background:${color}"></div></div>
  </div>`;
}

function renderList(p: Record<string, unknown>): string {
  const items = Array.isArray(p.items) ? (p.items as Record<string, unknown>[]) : [];
  const itemsHtml = items
    .map((item: Record<string, unknown>) => {
      const icon = item.icon ? String(item.icon) : "";
      const text = item.text ? escapeHtml(String(item.text)) : "";
      const desc = item.description ? `<span class="jr-list-desc">${escapeHtml(String(item.description))}</span>` : "";
      return `<div class="jr-list-item">
        ${icon ? `<span class="jr-list-icon">${escapeHtml(icon)}</span>` : ""}
        <div class="jr-list-content"><span class="jr-list-text">${text}</span>${desc}</div>
      </div>`;
    })
    .join("");
  return `<div class="jr-list">${itemsHtml}</div>`;
}

function renderChartContainer(key: string): string {
  return `<div class="jr-chart-container"><canvas id="chart-${key}"></canvas></div>`;
}

function renderMapContainer(key: string, p: Record<string, unknown>, defaultHeight: number): string {
  const h = typeof p.height === "number" ? p.height : defaultHeight;
  return `<div class="jr-map-container"><div id="map-${key}" style="height:${h}px;width:100%"></div></div>`;
}

function generateChartScript(p: Record<string, unknown>, type: string, key: string): string {
  const labels = Array.isArray(p.labels) ? (p.labels as string[]) : [];
  const datasets = Array.isArray(p.datasets)
    ? (p.datasets as { label?: string; data?: number[]; color?: string }[])
    : [];
  const title = p.title ? String(p.title) : "";
  const isHorizontal = p.direction === "horizontal";
  const axisIndex = isHorizontal ? "y" : "x";
  const chartType = type === "pie" ? "pie" : "bar";

  const D_COLORS = ["#1e40af", "#0d9488", "#c2410c", "#7e22ce", "#b45309", "#166534", "#dc2626", "#2563eb"];

  const ds = datasets.map((d, i) => ({
    label: d.label ?? "",
    data: d.data ?? [],
    backgroundColor: type === "pie"
      ? labels.map((_, j) => D_COLORS[j % D_COLORS.length])
      : (d.color ?? D_COLORS[i % D_COLORS.length]),
    borderColor: d.color ?? D_COLORS[i % D_COLORS.length],
    borderWidth: 1,
  }));

  const config = {
    type: chartType,
    data: { labels, datasets: ds },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: isHorizontal ? "y" : "x",
      plugins: {
        legend: { display: datasets.length > 1 || (datasets[0]?.label ?? "") !== "", position: "bottom" },
        title: title ? { display: true, text: title, font: { size: 14 } } : undefined,
      },
      scales: type === "pie" ? undefined : { [axisIndex]: { beginAtZero: true } },
    },
  };

  return `new Chart(document.getElementById('chart-${key}').getContext('2d'), ${JSON.stringify(config)});\n`;
}

function generateMapScript(p: Record<string, unknown>, key: string): string {
  const markers = Array.isArray(p.markers)
    ? (p.markers as { lat: number; lng: number; label: string; description?: string; detail?: string; color?: string; category?: string }[])
    : [];
  const style = typeof p.mapStyle === "string" ? p.mapStyle : "positron";

  const features = markers.map((m, i) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [m.lng, m.lat] },
    properties: {
      id: i,
      label: m.label,
      description: m.description ?? "",
      detail: m.detail ?? "",
      color: m.color ?? MAP_CATEGORY_COLORS[m.category?.toLowerCase() ?? ""] ?? "#dc2626",
      category: m.category ?? "",
    },
  }));

  const bounds = computeMapBounds(markers);
  const initView = bounds
    ? `map_${key}.fitBounds([[${bounds[0]}, ${bounds[1]}], [${bounds[2]}, ${bounds[3]}]], { padding: 40 })`
    : `map_${key}.setCenter([10.0, 56.0]); map_${key}.setZoom(7)`;

  return `
(function() {
  var map_${key} = new maplibregl.Map({
    container: 'map-${key}',
    style: 'https://tiles.openfreemap.org/styles/${style}',
    center: [10.0, 56.0],
    zoom: 7,
    attributionControl: false
  });
  map_${key}.on('load', function() {
    map_${key}.addSource('src-${key}', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: ${JSON.stringify(features)} }
    });
    map_${key}.addLayer({
      id: 'circles-${key}', type: 'circle', source: 'src-${key}',
      paint: { 'circle-radius': 6, 'circle-color': ['get', 'color'], 'circle-stroke-width': 2, 'circle-stroke-color': '#fff', 'circle-opacity': 0.9 }
    });
    map_${key}.addLayer({
      id: 'labels-${key}', type: 'symbol', source: 'src-${key}',
      layout: { 'text-field': ['get', 'label'], 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], 'text-size': 11, 'text-offset': [0, 1.5], 'text-anchor': 'top', 'text-allow-overlap': false, 'text-optional': true },
      paint: { 'text-color': '#1e293b', 'text-halo-color': '#fff', 'text-halo-width': 1.5 }
    });
    ${initView}
  });
  map_${key}.on('click', 'circles-${key}', function(e) {
    var props = e.features[0].properties, coords = e.features[0].geometry.coordinates.slice();
    var h = '<div class="popup-label">' + escapeHtml(props.label) + '</div>';
    if (props.description) h += '<div class="popup-desc">' + escapeHtml(props.description) + '</div>';
    if (props.detail) h += '<div class="popup-detail">' + escapeHtml(props.detail) + '</div>';
    if (props.category) h += '<div class="popup-detail" style="margin-top:5px;font-weight:500;color:' + props.color + '">\u25CF ' + escapeHtml(props.category) + '</div>';
    new maplibregl.Popup().setLngLat(coords).setHTML(h).addTo(map_${key});
  });
  map_${key}.on('mouseenter', 'circles-${key}', function() { map_${key}.getCanvas().style.cursor = 'pointer'; });
  map_${key}.on('mouseleave', 'circles-${key}', function() { map_${key}.getCanvas().style.cursor = ''; });
})();`;
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

function gapClass(gap: unknown): string {
  if (typeof gap === "string") return gap;
  return "md";
}

function formatTableCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  return escapeHtml(String(value));
}

function buildPage(opts: {
  title: string;
  tc: { bg: string };
  bodyHtml: string;
  hasChart: boolean;
  hasMap: boolean;
  chartScripts: string;
  mapScripts: string;
}): string {
  const { title, tc, bodyHtml, hasChart, hasMap, chartScripts, mapScripts } = opts;

  const chartCdn = hasChart ? '<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>' : "";
  const mapCdn = hasMap
    ? '<script src="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.js"></script><link href="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.css" rel="stylesheet" />'
    : "";

  const initScript = hasChart || hasMap
    ? `<script>${hasMap ? "function escapeHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;')}" : ""}
window.addEventListener('DOMContentLoaded',function(){${chartScripts}${mapScripts}});</script>`
    : "";

  return `<!DOCTYPE html>
<html lang="da">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
${chartCdn}
${mapCdn}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#f8fafc;color:#1e293b;line-height:1.5}
.jr-page-header{background:${tc.bg};color:#fff;padding:28px 36px}
.jr-page-header h1{font-size:22px;font-weight:700}
.jr-page-body{max-width:960px;margin:0 auto;padding:28px 20px;display:flex;flex-direction:column;gap:20px}
.jr-card{background:#fff;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden}
.jr-card-header{padding:14px 18px;font-size:15px;font-weight:600;color:#0f172a;border-bottom:1px solid #f1f5f9}
.jr-card-body{padding:18px;display:flex;flex-direction:column;gap:16px}
.jr-stack{display:flex;gap:16px}
.jr-grid{display:grid;gap:16px}
.jr-heading{font-weight:600;color:#0f172a}
.jr-h1{font-size:24px}.jr-h2{font-size:20px}.jr-h3{font-size:17px}.jr-h4{font-size:15px;color:#475569}
.jr-text{font-size:14px;color:#334155;line-height:1.65}
.jr-text-lead{font-size:16px;color:#1e293b;line-height:1.7}
.jr-text-caption{font-size:12px;color:#94a3b8}
.jr-badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:500;white-space:nowrap}
.jr-separator{border:none;border-top:1px solid #e2e8f0;margin:8px 0}
.jr-metric{padding:4px 0}
.jr-metric-label{font-size:11px;font-weight:500;color:#64748b;text-transform:uppercase;letter-spacing:0.4px}
.jr-metric-value{font-size:26px;font-weight:700;color:#0f172a;margin:2px 0}
.jr-metric-change{font-size:13px;font-weight:500}
.jr-table-wrapper{overflow-x:auto}
.jr-table-wrapper table{width:100%;border-collapse:collapse;font-size:13px}
.jr-table-wrapper caption{font-size:13px;color:#64748b;text-align:left;margin-bottom:8px}
.jr-table-wrapper th{background:#f1f5f9;color:#475569;font-weight:600;text-align:left;padding:9px 12px;border-bottom:2px solid #e2e8f0}
.jr-table-wrapper td{padding:9px 12px;border-bottom:1px solid #f1f5f9}
.jr-table-wrapper tr:hover td{background:#f8fafc}
.jr-chart-container{background:#fff;border-radius:10px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
.jr-chart-container canvas{max-height:320px}
.jr-progress{padding:4px 0}
.jr-progress-label{font-size:12px;color:#475569;margin-bottom:4px;display:flex;justify-content:space-between}
.jr-progress-track{height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden}
.jr-progress-fill{height:100%;border-radius:4px;transition:width .3s}
.jr-list{display:flex;flex-direction:column;gap:6px}
.jr-list-item{display:flex;align-items:flex-start;gap:10px;padding:8px 0}
.jr-list-item+.jr-list-item{border-top:1px solid #f1f5f9}
.jr-list-icon{font-size:16px;flex-shrink:0;width:20px;text-align:center}
.jr-list-content{display:flex;flex-direction:column}
.jr-list-text{font-size:14px;color:#1e293b}
.jr-list-desc{font-size:12px;color:#94a3b8}
.jr-map-container{border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
.jr-unknown{padding:8px;border:1px dashed #e2e8f0;border-radius:6px;font-size:12px;color:#94a3b8}
.maplibregl-popup{max-width:240px!important}
.maplibregl-popup-content{font-family:inherit;padding:8px 10px;border-radius:8px;font-size:12px}
.popup-label{font-weight:600;color:#1e293b}
.popup-desc{color:#475569;margin-top:2px}
.popup-detail{color:#64748b;font-size:11px;margin-top:2px}
.jr-footer{text-align:center;padding:20px;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0}
@media print{
  body{background:#fff}
  .jr-page-header{background:${tc.bg}!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .jr-chart-container,.jr-map-container{break-inside:avoid}
}
</style>
</head>
<body>
<div class="jr-page-header"><h1>${escapeHtml(title)}</h1></div>
<div class="jr-page-body">${bodyHtml}</div>
<div class="jr-footer">OpenFreeMap &copy; <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a></div>
${initScript}
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
