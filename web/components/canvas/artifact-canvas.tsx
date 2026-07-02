"use client";

import * as React from "react";
import {
  BarChart3,
  Building2,
  Globe2,
  Info,
  LayoutGrid,
  Loader2,
  Map as MapIcon,
  ScrollText,
  Sparkles,
} from "lucide-react";
import type { ArtifactCall } from "@/lib/artifacts";
import { ArtifactChart } from "./artifact-chart";
import { ArtifactCardView } from "./artifact-card";
import { ArtifactTable } from "./artifact-table";
import { ArtifactMap } from "./artifact-map";
import { Badge } from "@/components/ui/badge";
import { cn, shortToolName } from "@/lib/utils";
import type {
  CardPayload,
  ChartPayload,
  MapPayload,
  TablePayload,
} from "@/lib/artifacts";

export interface ArtifactCanvasProps {
  artifact: ArtifactCall | null;
  className?: string;
}

/**
 * Right-hand live artifact pane — always shows the freshest tool result the
 * agent has produced. While loading, surfaces a spinner placeholder so users
 * see that something is happening. Empty state shows example prompts.
 */
export function ArtifactCanvas({ artifact, className }: ArtifactCanvasProps) {
  return (
    <aside
      className={cn(
        "flex h-full min-w-0 flex-col border-l border-border bg-card",
        className
      )}
    >
      <CanvasHeader artifact={artifact} />
      <div className="flex-1 min-h-0 overflow-hidden p-5">
        {artifact ? <ArtifactBody artifact={artifact} /> : <EmptyCanvas />}
      </div>
    </aside>
  );
}

function CanvasHeader({ artifact }: { artifact: ArtifactCall | null }) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card/60 px-5 py-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h2 className="text-sm font-semibold tracking-tight">Canvas</h2>
        <span className="text-xs text-muted-foreground">
          {artifact
            ? artifact.kind === "raw"
              ? "Latest output"
              : `Latest ${artifact.kind}`
            : "Awaiting tool calls"}
        </span>
      </div>
      {artifact && (
        <Badge variant="outline" className="font-mono text-[0.7rem]">
          {shortToolName(artifact.toolName)}
        </Badge>
      )}
    </header>
  );
}

function ArtifactBody({ artifact }: { artifact: ArtifactCall }) {
  const isLoading = artifact.state === "input-available";

  if (isLoading) {
    return (
      <div className="grid h-full place-items-center text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span>Generating {shortToolName(artifact.toolName)}…</span>
        </div>
      </div>
    );
  }

  // `artifact.artifact` is a discriminated union narrowed here by `kind`.
  switch (artifact.kind) {
    case "chart":
      return (
        <ArtifactChart
          data={artifact.artifact.payload as import("@/lib/artifacts").ChartPayload}
          className="h-full"
        />
      );
    case "card":
      return (
        <ArtifactCardView
          data={artifact.artifact.payload as import("@/lib/artifacts").CardPayload}
          className="h-full"
        />
      );
    case "table": {
      const p = artifact.artifact.payload as import("@/lib/artifacts").TablePayload;
      return (
        <ArtifactTable
          title={p.title}
          footer={p.footer}
          rows={p.rows}
          columns={p.columns}
          className="h-full"
        />
      );
    }
    case "map":
      return (
        <ArtifactMap
          data={artifact.artifact.payload as import("@/lib/artifacts").MapPayload}
          className="h-full"
        />
      );
    default:
      return <RawOutputView artifact={artifact} className="h-full" />;
  }
}

function RawOutputView({
  artifact,
  className,
}: {
  artifact: ArtifactCall;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-3 overflow-auto rounded-[10px] border border-dashed border-border bg-muted/30 p-4 scrollable",
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="size-3.5" />
        <span>Other tool output</span>
      </div>
      <pre className="flex-1 overflow-auto rounded-[10px] bg-card p-3 font-mono text-xs leading-relaxed">
        {JSON.stringify(artifact.output ?? artifact.input ?? {}, null, 2)}
      </pre>
    </div>
  );
}

function EmptyCanvas() {
  const hints = [
    {
      icon: <Building2 className="size-4" />,
      title: "Property due diligence",
      body: "Lookup an address or BFE — owners, encumbrances, AVM, energy label.",
    },
    {
      icon: <BarChart3 className="size-4" />,
      title: "Investment analysis",
      body: "Cap rates, sensitivity, financing scenarios for a target property.",
    },
    {
      icon: <LayoutGrid className="size-4" />,
      title: "Market research",
      body: "Comparables and price trends for a postcode or area.",
    },
    {
      icon: <MapIcon className="size-4" />,
      title: "Map view",
      body: "Ask for a specific location — the agent will return coordinates.",
    },
    {
      icon: <Globe2 className="size-4" />,
      title: "Ownership tracing",
      body: "Follow the CVR network backwards to find the ultimate owner.",
    },
    {
      icon: <ScrollText className="size-4" />,
      title: "Valuation (AVM)",
      body: "Get a model-estimated price with confidence bounds.",
    },
  ];
  return (
    <div className="flex h-full flex-col gap-3 overflow-auto scrollable">
      <div className="rounded-[14px] border border-dashed border-border bg-muted/30 p-5">
        <h3 className="text-base font-semibold tracking-tight">
          Ready when you are.
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask the Resights agent on the left. Charts, cards, tables, and
          maps will appear here as it works.
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-2">
        {hints.map((h, i) => (
          <li key={i} className="rounded-[10px] border border-border bg-card p-3 text-sm">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              {h.icon}
              <span>{h.title}</span>
            </div>
            <div className="mt-1 text-sm">{h.body}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
