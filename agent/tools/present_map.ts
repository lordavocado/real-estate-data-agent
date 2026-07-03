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
  description: z
    .string()
    .optional()
    .describe("Popup description shown on click."),
  color: z
    .string()
    .optional()
    .describe("Hex color for the marker dot. Auto-assigned if a known category is provided."),
  category: z
    .string()
    .optional()
    .describe("Category for color-coding and legend grouping."),
  detail: z
    .string()
    .optional()
    .describe("Additional detail line in the popup."),
});

export default defineTool({
  description:
    "Generate an interactive map with geolocated markers. Renders live inline in the chat via Leaflet (CARTO Positron light tiles) and also saves a self-contained HTML file to output/. Use when the user wants to see locations — properties on a street, comparable sales, company addresses, or regional analysis.",
  inputSchema: z.object({
    title: z.string().describe("Map title displayed above the map."),
    markers: z.array(markerSchema).describe("Array of markers to place on the map."),
    style: z
      .enum(["positron", "bright", "liberty", "dark", "fiord"])
      .optional()
      .default("positron")
      .describe(
        "Map style. Positron (light/clean, best for data), Bright (colorful), Liberty (classic topographic), Dark (dark mode), Fiord (3D terrain). Default: positron."
      ),
    center: z
      .object({ lat: z.number(), lng: z.number() })
      .optional()
      .describe("Map center. Auto-fits to markers if omitted. Falls back to Denmark center (56.0, 10.0)."),
    zoom: z
      .number()
      .min(3)
      .max(18)
      .optional()
      .describe("Zoom level (3-18). Ignored when auto-fitting to markers."),
    height: z
      .number()
      .optional()
      .default(600)
      .describe("Map height in pixels."),
  }),
  async execute({ title, markers, style = "positron", center, zoom, height = 600 }) {
    const bounds = computeBounds(markers);
    const mapCenter = center ?? { lat: 56.0, lng: 10.0 };
    const mapZoom = zoom ?? 7;

    const categories = collectCategories(markers);
    const hasLegend = categories.length > 1;

    const previewUrl = buildPreviewUrl(bounds, mapCenter, mapZoom);

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

    const html = buildHtml({
      title,
      style,
      features,
      bounds,
      mapCenter,
      mapZoom,
      height,
      categories,
      hasLegend,
    });

    const outputDir = join(process.cwd(), "output");
    mkdirSync(outputDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `map_${timestamp}.html`;
    const filePath = join(outputDir, filename);
    writeFileSync(filePath, html, "utf-8");

    const markerList = markers
      .map((m) => {
        const cat = m.category ? ` (${m.category})` : "";
        return `- **${m.label}**${cat} — [${m.lat.toFixed(5)}, ${m.lng.toFixed(5)}]${m.description ? " _" + m.description + "_" : ""}`;
      })
      .join("\n");

    const legendText = hasLegend
      ? "\n\n**Signaturforklaring:**\n" +
        categories
          .map(
            (c) =>
              `- <span style="color:${c.color}">⬤</span> ${c.name}`
          )
          .join("\n")
      : "";

    const summary = [
      `## ${title}`,
      ``,
      `![${title}](${previewUrl})`,
      ``,
      `Kort med **${markers.length} markører** — vist inline i chatten.`,
      ``,
      markerList,
      legendText,
      ``,
      `Interaktiv HTML-fallback: \`${filePath}\`.`,
    ].join("\n");

    return {
      filePath,
      filename,
      html,
      previewUrl,
      markdown: summary,
      markerCount: markers.length,
      bounds: bounds
        ? {
            southwest: { lat: bounds[1], lng: bounds[0] },
            northeast: { lat: bounds[3], lng: bounds[2] },
          }
        : null,
      map: {
        title,
        points: markers.map((m) => ({
          lat: m.lat,
          lng: m.lng,
          label: m.label,
          detail: m.detail ?? m.description,
          color:
            m.color ??
            CATEGORY_COLORS[m.category?.toLowerCase() ?? ""] ??
            undefined,
        })),
        center: mapCenter,
        zoom: mapZoom,
      },
    };
  },
});

function computeBounds(
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

function buildPreviewUrl(
  bounds: [number, number, number, number] | null,
  center: { lat: number; lng: number },
  zoom: number
): string {
  if (bounds) {
    const midLat = (bounds[1] + bounds[3]) / 2;
    const midLng = (bounds[0] + bounds[2]) / 2;
    const latSpan = bounds[3] - bounds[1];
    const bestZoom = Math.min(17, Math.round(Math.log2((360 * 256) / (latSpan * 512))) - 2);
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${midLat.toFixed(5)},${midLng.toFixed(5)}&zoom=${bestZoom}&size=600x320&maptype=mapnik&markers=${midLat.toFixed(5)},${midLng.toFixed(5)},red-pushpin`;
  }
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${center.lat.toFixed(5)},${center.lng.toFixed(5)}&zoom=${zoom}&size=600x320&maptype=mapnik`;
}

function collectCategories(
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

function buildHtml(opts: {
  title: string;
  style: string;
  features: object[];
  bounds: [number, number, number, number] | null;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  height: number;
  categories: { name: string; color: string }[];
  hasLegend: boolean;
}): string {
  const { title, style: mapStyle, features, bounds, mapCenter, mapZoom, height, categories, hasLegend } = opts;
  const tileStyleUrl = `https://tiles.openfreemap.org/styles/${mapStyle}`;

  const initView = bounds
    ? `map.fitBounds([[${bounds[0]}, ${bounds[1]}], [${bounds[2]}, ${bounds[3]}]], { padding: 50 })`
    : `map.setCenter([${mapCenter.lng}, ${mapCenter.lat}]); map.setZoom(${mapZoom})`;

  const legendHtml = hasLegend
    ? `<div id="legend">
      <strong>Signaturforklaring</strong>
      ${categories
        .map(
          (c) =>
            `<div class="legend-item"><span class="legend-dot" style="background:${c.color}"></span> ${c.name}</div>`
        )
        .join("")}
    </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="da">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<script src="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.js"></script>
<link href="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.css" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
  .header { background: #1e40af; color: white; padding: 16px 24px; }
  .header h1 { font-size: 20px; font-weight: 600; }
  .header .meta { font-size: 13px; opacity: 0.85; margin-top: 4px; }
  #map { height: ${height}px; width: 100%; }
  #legend { position: absolute; bottom: 24px; left: 12px; background: rgba(255,255,255,0.92); padding: 10px 14px; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.15); font-size: 13px; z-index: 1; }
  .legend-item { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .maplibregl-popup { max-width: 280px !important; }
  .maplibregl-popup-content { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 12px 14px; border-radius: 8px; line-height: 1.5; }
  .popup-label { font-weight: 600; font-size: 14px; color: #1e293b; }
  .popup-desc { font-size: 13px; color: #475569; margin-top: 4px; }
  .popup-detail { font-size: 12px; color: #64748b; margin-top: 2px; }
  .attribution { font-size: 11px; color: #94a3b8; padding: 8px 24px; text-align: right; }
  .attribution a { color: #64748b; }
</style>
</head>
<body>
<div class="header">
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">${features.length} markører &middot; OpenFreeMap &middot; OpenStreetMap</div>
</div>
<div style="position:relative">
  ${legendHtml}
  <div id="map"></div>
</div>
<div class="attribution">
  <a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>
</div>
<script>
const features = ${JSON.stringify(features)};

const map = new maplibregl.Map({
  container: 'map',
  style: '${tileStyleUrl}',
  center: [${mapCenter.lng}, ${mapCenter.lat}],
  zoom: ${mapZoom},
  attributionControl: false
});

map.on('load', () => {
  map.addSource('markers', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features }
  });

  map.addLayer({
    id: 'marker-circles',
    type: 'circle',
    source: 'markers',
    paint: {
      'circle-radius': 7,
      'circle-color': ['get', 'color'],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
      'circle-opacity': 0.9
    }
  });

  map.addLayer({
    id: 'marker-labels',
    type: 'symbol',
    source: 'markers',
    layout: {
      'text-field': ['get', 'label'],
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': 12,
      'text-offset': [0, 1.6],
      'text-anchor': 'top',
      'text-allow-overlap': false,
      'text-optional': true
    },
    paint: {
      'text-color': '#1e293b',
      'text-halo-color': '#ffffff',
      'text-halo-width': 2
    }
  });

  ${initView}
});

map.on('click', 'marker-circles', (e) => {
  const props = e.features[0].properties;
  const coords = e.features[0].geometry.coordinates.slice();
  let popupHtml = '<div class="popup-label">' + escapeHtml(props.label) + '</div>';
  if (props.description) popupHtml += '<div class="popup-desc">' + escapeHtml(props.description) + '</div>';
  if (props.detail) popupHtml += '<div class="popup-detail">' + escapeHtml(props.detail) + '</div>';
  if (props.category) popupHtml += '<div class="popup-detail" style="margin-top:6px;font-weight:500;color:' + props.color + '">⬤ ' + escapeHtml(props.category) + '</div>';
  new maplibregl.Popup().setLngLat(coords).setHTML(popupHtml).addTo(map);
});

map.on('mouseenter', 'marker-circles', () => { map.getCanvas().style.cursor = 'pointer'; });
map.on('mouseleave', 'marker-circles', () => { map.getCanvas().style.cursor = ''; });
</script>
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
