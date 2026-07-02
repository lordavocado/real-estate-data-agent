"use client";

import * as React from "react";
import { defineRegistry } from "@json-render/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArtifactChart } from "@/components/canvas/artifact-chart";
import { ArtifactTable } from "@/components/canvas/artifact-table";
import { ArtifactMap } from "@/components/canvas/artifact-map";
import type { ChartPayload } from "@/lib/artifacts";
import { resightsCatalog } from "./catalog";

const GAP: Record<string, string> = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
};

const CHART_HEIGHT = 280;

function uiChartPayload(
  type: ChartPayload["type"],
  props: Record<string, unknown>
): ChartPayload {
  const labels = Array.isArray(props.labels)
    ? (props.labels as string[])
    : [];
  const rawDatasets = Array.isArray(props.datasets)
    ? (props.datasets as Array<{
        label?: string;
        data?: number[];
        color?: string;
      }>)
    : [];
  return {
    title: typeof props.title === "string" ? props.title : undefined,
    type,
    labels,
    datasets: rawDatasets.map((ds) => ({
      label: ds.label ?? "",
      data: ds.data ?? [],
      backgroundColor: ds.color,
      borderColor: ds.color,
    })),
  };
}

export const { registry } = defineRegistry(resightsCatalog, {
  components: {
    Card: ({ props, children }) => (
      <div
        className="w-full rounded-[14px] border border-border bg-card"
        style={
          props.maxWidth
            ? { maxWidth: props.maxWidth }
            : undefined
        }
      >
        {props.title ? (
          <div className="border-b border-border px-4 py-3 text-sm font-medium tracking-tight">
            {props.title}
          </div>
        ) : null}
        <div className="p-4">{children}</div>
      </div>
    ),

    Stack: ({ props, children }) => (
      <div
        className={cn(
          "flex w-full",
          props.direction === "row" ? "flex-row flex-wrap" : "flex-col",
          GAP[props.gap ?? "md"] ?? "gap-4"
        )}
        style={{
          alignItems: props.align ?? undefined,
          justifyContent: props.justify ?? undefined,
        }}
      >
        {children}
      </div>
    ),

    Grid: ({ props, children }) => (
      <div
        className={cn(
          "grid w-full",
          GAP[props.gap ?? "md"] ?? "gap-4"
        )}
        style={{
          gridTemplateColumns: `repeat(${props.columns ?? 2}, minmax(0, 1fr))`,
        }}
      >
        {children}
      </div>
    ),

    Heading: ({ props }) => {
      const level = Math.min(Math.max(props.level ?? 2, 1), 4);
      const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4";
      const size =
        level === 1
          ? "text-lg font-semibold tracking-tight"
          : level === 2
            ? "text-base font-semibold tracking-tight"
            : "text-sm font-medium";
      return <Tag className={size}>{props.text}</Tag>;
    },

    Text: ({ props }) => (
      <p
        className={cn(
          props.variant === "caption" && "text-xs text-muted-foreground",
          props.variant === "lead" && "text-base font-medium",
          (props.variant === "body" || !props.variant) && "text-sm",
          props.muted && "text-muted-foreground"
        )}
      >
        {props.text}
      </p>
    ),

    Badge: ({ props }) => (
      <Badge variant="outline" className="rounded-[26px] text-xs font-medium">
        {props.text}
      </Badge>
    ),

    Separator: () => <Separator className="my-2" />,

    Metric: ({ props }) => (
      <div className="rounded-[14px] border border-border bg-card px-4 py-3">
        <div className="text-xs text-muted-foreground">{props.label}</div>
        <div className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
          {props.value}
        </div>
        {props.detail ? (
          <div className="mt-0.5 text-xs text-muted-foreground">
            {props.detail}
          </div>
        ) : null}
        {props.change ? (
          <div className="mt-1 text-xs text-muted-foreground">
            {props.changeType === "positive"
              ? "↑ "
              : props.changeType === "negative"
                ? "↓ "
                : "→ "}
            {props.change}
          </div>
        ) : null}
      </div>
    ),

    Table: ({ props }) => {
      const columns = (props.columns ?? []).map((header, i) => ({
        header,
        key: String(i),
        align: "left" as const,
        format: "text" as const,
      }));
      const rows = (props.rows ?? []).map((row) => {
        const obj: Record<string, unknown> = {};
        row.forEach((cell, i) => {
          obj[String(i)] = cell;
        });
        return obj;
      });
      return (
        <ArtifactTable
          title={props.caption ?? undefined}
          columns={columns}
          rows={rows}
          className="max-h-[360px]"
        />
      );
    },

    BarChart: ({ props }) => (
      <div className="h-[280px] w-full min-w-0">
        <ArtifactChart
          data={uiChartPayload(
            props.direction === "horizontal" ? "horizontal_bar" : "bar",
            props as Record<string, unknown>
          )}
          className="h-full"
        />
      </div>
    ),

    LineChart: ({ props }) => (
      <div className="h-[280px] w-full min-w-0">
        <ArtifactChart
          data={uiChartPayload("line", props as Record<string, unknown>)}
          className="h-full"
        />
      </div>
    ),

    PieChart: ({ props }) => (
      <div className="h-[280px] w-full min-w-0">
        <ArtifactChart
          data={uiChartPayload("pie", props as Record<string, unknown>)}
          className="h-full"
        />
      </div>
    ),

    Progress: ({ props }) => {
      const max = props.max ?? 100;
      const pct = max > 0 ? Math.min(100, (props.value / max) * 100) : 0;
      return (
        <div className="w-full">
          {props.label ? (
            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
              <span>{props.label}</span>
              <span className="tabular-nums">{Math.round(pct)}%</span>
            </div>
          ) : null}
          <div className="h-2 w-full overflow-hidden rounded-full border border-border bg-muted">
            <div
              className="h-full bg-foreground transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      );
    },

    List: ({ props }) => (
      <ul className="flex flex-col gap-2">
        {(props.items ?? []).map((item, i) => (
          <li key={i} className="flex gap-2 text-sm">
            {item.icon ? (
              <span className="shrink-0 text-muted-foreground">{item.icon}</span>
            ) : null}
            <div className="min-w-0">
              <div>{item.text}</div>
              {item.description ? (
                <div className="text-xs text-muted-foreground">
                  {item.description}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    ),

    MapView: ({ props }) => (
      <div
        className="w-full min-w-0"
        style={{ height: props.height ?? CHART_HEIGHT }}
      >
        <ArtifactMap
          data={{
            title: props.title ?? undefined,
            points: (props.points ?? []).map((p) => ({
              lat: p.lat,
              lng: p.lng,
              label: p.label ?? undefined,
              detail: p.detail ?? undefined,
            })),
            center: props.center ?? undefined,
            zoom: props.zoom ?? undefined,
          }}
          className="h-full"
        />
      </div>
    ),
  },
});
