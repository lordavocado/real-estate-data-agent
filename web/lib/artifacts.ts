/**
 * Tool-name heuristics for identifying artifact-bearing tool calls.
 *
 * Eve prefixes OpenAPI connection tools (internal connection id) and exposes
 * framework tools like `present_chart` directly.
 * anything else — the canvas falls back to "raw output" mode.
 */
export const ARTIFACT_TOOLS = {
  chart: new Set([
    "present_chart",
    "resights__present_chart",
  ]),
  card: new Set([
    "present_card",
    "resights__present_card",
  ]),
  table: new Set([
    "present_table",
    "resights__present_table",
  ]),
  map: new Set([
    "present_map",
    "resights__present_map",
    "resights__gis_search",
  ]),
  ui: new Set([
    "present_ui",
    "resights__present_ui",
  ]),
} as const;

export type ArtifactKind = "chart" | "card" | "table" | "map" | "ui" | "raw";

export function classifyToolName(name: string): ArtifactKind {
  if (!name) return "raw";
  const n = name.toLowerCase();
  if (ARTIFACT_TOOLS.chart.has(n)) return "chart";
  if (ARTIFACT_TOOLS.card.has(n)) return "card";
  if (ARTIFACT_TOOLS.table.has(n)) return "table";
  if (ARTIFACT_TOOLS.map.has(n)) return "map";
  if (ARTIFACT_TOOLS.ui.has(n)) return "ui";
  return "raw";
}

export interface ChartPayload {
  title?: string;
  type?: "bar" | "horizontal_bar" | "line" | "pie" | "scatter";
  source?: string;
  labels?: string[];
  // `present_chart` outputs Recharts-shaped rows: each dataset has
  //   { label, data: number[] } — `data` is the actual wire format.
  datasets?: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    color?: string;
  }>;
  text?: string;
}

export interface CardPayload {
  title?: string;
  subtitle?: string;
  footer?: string;
  badge?: { text: string; color?: string };
  fields?: Array<{
    label: string;
    value: string;
    emphasis?: boolean;
    detail?: string;
  }>;
  sections?: Array<{
    heading: string;
    fields: Array<{
      label: string;
      value: string;
      emphasis?: boolean;
      detail?: string;
    }>;
  }>;
  markdown?: string;
}

export interface TablePayload {
  title?: string;
  footer?: string;
  rows?: Array<Record<string, unknown>>;
  columns?: Array<{
    header: string;
    key: string;
    align?: "left" | "right" | "center";
    format?:
      | "number"
      | "currency_dkk"
      | "currency_eur"
      | "percentage"
      | "area_m2"
      | "date"
      | "text";
  }>;
  markdown?: string;
}

export interface MapPayload {
  title?: string;
  points?: Array<{
    lat: number;
    lng: number;
    label?: string;
    detail?: string;
    /** Status accent for marker dot (DESIGN.md: ~10px only) */
    color?: string;
  }>;
  center?: { lat: number; lng: number };
  zoom?: number;
  text?: string;
}

export interface UiPayload {
  root?: string;
  elements?: Record<string, unknown>;
  data?: Record<string, unknown>;
  title?: string;
}

export type ArtifactPayload =
  | { kind: "chart"; payload: ChartPayload }
  | { kind: "card"; payload: CardPayload }
  | { kind: "table"; payload: TablePayload }
  | { kind: "map"; payload: MapPayload }
  | { kind: "ui"; payload: UiPayload }
  | { kind: "raw"; payload: unknown };

export interface ArtifactCall {
  toolCallId: string;
  toolName: string;
  kind: ArtifactKind;
  state: string;
  input: unknown;
  output: unknown;
  artifact: ArtifactPayload;
  messageId: string;
  receivedAt: number;
}

/** Try to decode whatever the tool-returned object actually contains. */
export function parseArtifact(
  toolName: string,
  output: unknown
): ArtifactPayload {
  const kind = classifyToolName(toolName);
  if (!output || typeof output !== "object") {
    return { kind: "raw", payload: output };
  }
  const obj = output as Record<string, unknown>;

  switch (kind) {
    case "chart": {
      // `present_chart` returns nested data:
      //   { text, chart: { title, type, labels, datasets, options, source } }
      const inner =
        obj.chart && typeof obj.chart === "object"
          ? (obj.chart as Record<string, unknown>)
          : obj;
      return {
        kind: "chart",
        payload: {
          title:
            typeof inner.title === "string" ? inner.title : undefined,
          type: inner.type as ChartPayload["type"],
          source:
            typeof inner.source === "string" ? inner.source : undefined,
          labels: Array.isArray(inner.labels)
            ? (inner.labels.filter(
                (v) => typeof v === "string"
              ) as string[])
            : [],
          datasets: Array.isArray(inner.datasets)
            ? (inner.datasets as ChartPayload["datasets"])
            : [],
          text:
            typeof obj.text === "string" ? obj.text : undefined,
        },
      };
    }
    case "card":
      return { kind: "card", payload: obj as CardPayload };
    case "table":
      return { kind: "table", payload: obj as TablePayload };
    case "map": {
      const inner =
        obj.map && typeof obj.map === "object"
          ? (obj.map as Record<string, unknown>)
          : obj;
      const rawPoints =
        (Array.isArray(inner.points) && inner.points) ||
        (Array.isArray(inner.markers) && inner.markers) ||
        [];
      return {
        kind: "map",
        payload: {
          title:
            typeof inner.title === "string" ? inner.title : undefined,
          points: rawPoints
            .filter(
              (p): p is { lat: number; lng: number } =>
                typeof p === "object" &&
                p !== null &&
                typeof (p as { lat?: unknown }).lat === "number" &&
                typeof (p as { lng?: unknown }).lng === "number"
            )
            .map((p) => {
              const pt = p as {
                lat: number;
                lng: number;
                label?: string;
                detail?: string;
                description?: string;
                color?: string;
              };
              return {
                lat: pt.lat,
                lng: pt.lng,
                label: pt.label,
                detail: pt.detail ?? pt.description,
                color: typeof pt.color === "string" ? pt.color : undefined,
              };
            }),
          center:
            inner.center &&
            typeof inner.center === "object" &&
            typeof (inner.center as { lat?: unknown }).lat === "number"
              ? (inner.center as MapPayload["center"])
              : undefined,
          zoom:
            typeof inner.zoom === "number" ? inner.zoom : undefined,
        },
      };
    }
    case "ui":
      return {
        kind: "ui",
        payload: {
          root: typeof obj.root === "string" ? obj.root : undefined,
          elements:
            obj.elements && typeof obj.elements === "object"
              ? (obj.elements as Record<string, unknown>)
              : undefined,
          data:
            obj.data && typeof obj.data === "object"
              ? (obj.data as Record<string, unknown>)
              : undefined,
          title:
            typeof obj.title === "string" ? obj.title : undefined,
        },
      };
    default:
      return { kind: "raw", payload: obj };
  }
}
