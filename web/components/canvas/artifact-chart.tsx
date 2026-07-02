"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import type { ChartPayload } from "@/lib/artifacts";

/** Achromatic series — DESIGN.md: no chromatic chart accents */
const PALETTE = [
  "#0a0a0a",
  "#737373",
  "#a1a1a1",
  "#b9b9b9",
  "#171717",
  "#000000",
  "#525252",
  "#d4d4d4",
];

export interface ArtifactChartProps {
  data: ChartPayload;
  className?: string;
}

interface DatumRow {
  label: string;
  [series: string]: string | number;
}

/**
 * Recharts-backed renderer for the `present_chart` tool output. Supports
 * bar (incl. horizontal_bar), line, pie, and scatter. Defensive about
 * missing/empty arrays — never throws on bad payloads.
 */
export function ArtifactChart({ data, className }: ArtifactChartProps) {
  const rows = buildRows(data);
  const palette = (data.datasets ?? []).map(
    (d, i) => d.backgroundColor ?? d.borderColor ?? PALETTE[i % PALETTE.length]
  );

  const chart = (() => {
    if (!rows.length) {
      return (
        <div className="grid h-full place-items-center text-sm text-muted-foreground">
          No data points provided.
        </div>
      );
    }

    switch (data.type) {
      case "horizontal_bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 16, right: 24, left: 24, bottom: 16 }}
            >
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11 }}
                width={120}
              />
              <Tooltip {...tooltipProps} />
              {(data.datasets ?? []).map((ds, i) => (
                <Bar
                  key={ds.label}
                  dataKey={ds.label}
                  fill={palette[i]}
                  radius={[0, 4, 4, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rows}
              margin={{ top: 16, right: 24, left: 16, bottom: 16 }}
            >
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...tooltipProps} />
              {(data.datasets ?? []).map((ds, i) => (
                <Line
                  key={ds.label}
                  type="monotone"
                  dataKey={ds.label}
                  stroke={palette[i]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip {...tooltipProps} />
              <Legend />
              <Pie
                data={rows}
                dataKey={(data.datasets?.[0]?.label ?? "value") as string}
                nameKey="label"
                outerRadius={110}
                innerRadius={50}
                paddingAngle={2}
              >
                {rows.map((_, i) => (
                  <Cell key={i} fill={palette[i % palette.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );
      case "scatter":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 16, right: 24, left: 16, bottom: 16 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="x" tick={{ fontSize: 11 }} />
              <YAxis dataKey="y" tick={{ fontSize: 11 }} />
              <ZAxis range={[60, 60]} />
              <Tooltip {...tooltipProps} />
              <Scatter
                data={rows}
                fill={palette[0]}
                name={data.datasets?.[0]?.label ?? "data"}
              />
            </ScatterChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              margin={{ top: 16, right: 24, left: 16, bottom: 16 }}
            >
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...tooltipProps} />
              {(data.datasets ?? []).map((ds, i) => (
                <Bar
                  key={ds.label}
                  dataKey={ds.label}
                  fill={palette[i]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  })();

  return (
    <div className={cn("flex h-full w-full flex-col gap-3", className)}>
      <ChartHeader data={data} />
      <div className="min-h-0 flex-1">{chart}</div>
    </div>
  );
}

function ChartHeader({ data }: { data: ChartPayload }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <h3 className="text-base font-semibold tracking-tight">
          {data.title ?? "Untitled chart"}
        </h3>
        <div className="text-xs text-muted-foreground">
          {[data.type, data.source].filter(Boolean).join(" · ")}
        </div>
      </div>
    </div>
  );
}

function buildRows(data: ChartPayload): DatumRow[] {
  const labels = data.labels ?? [];
  const datasets = data.datasets ?? [];
  if (!datasets.length) {
    return labels.map((label) => ({ label, value: 0 }));
  }

  // Scatter: `dataset.data` entries are [x, y] pairs.
  if (data.type === "scatter") {
    return labels.map((label, i) => {
      const value = (datasets[0]?.data?.[i] ?? []) as unknown;
      if (Array.isArray(value)) {
        return { label, x: Number(value[0] ?? 0), y: Number(value[1] ?? 0) };
      }
      return { label, x: i, y: Number(value ?? 0) };
    });
  }
  return labels.map((label, i) => {
    const row: DatumRow = { label };
    for (const ds of datasets) {
      row[ds.label] = Number(ds.data?.[i] ?? 0);
    }
    return row;
  });
}

const tooltipProps = {
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    fontSize: 12,
  },
  labelStyle: { color: "var(--muted-foreground)", fontSize: 11 },
  cursor: { fill: "var(--muted)" },
} as const;
