"use client";

import * as React from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { classifyToolName, parseArtifact } from "@/lib/artifacts";
import { toolActivityLabel } from "@/lib/tool-labels";
import { specFromPresentUi, stateFromPresentUi } from "@/lib/render/spec-utils";
import { InlineUiSpec } from "./inline-ui";
import { ArtifactChart } from "@/components/canvas/artifact-chart";
import { ArtifactCardView } from "@/components/canvas/artifact-card";
import { ArtifactTable } from "@/components/canvas/artifact-table";
import { ArtifactMap } from "@/components/canvas/artifact-map";
import type {
  CardPayload,
  ChartPayload,
  MapPayload,
  TablePayload,
} from "@/lib/artifacts";

export interface InlineArtifactProps {
  toolName: string;
  state: string;
  input?: unknown;
  output?: unknown;
  className?: string;
  /** When true, only render the chart/table/card (no status chip). */
  hideStatus?: boolean;
}

/**
 * Inline presentation block for artifact-bearing tool calls.
 * Loading → compact status chip; complete → chart / table / card / map.
 */
export function InlineArtifact({
  toolName,
  state,
  input,
  output,
  className,
  hideStatus = false,
}: InlineArtifactProps) {
  const kind = classifyToolName(toolName);
  const isLoading =
    state === "input-streaming" || state === "input-available";
  const failed =
    state === "output-error" ||
    state === "output-denied";
  const hasOutput = state === "output-available" && output !== undefined;

  if (isLoading) {
    if (hideStatus) return null;
    return (
      <ToolStatusChip
        toolName={toolName}
        loading
        className={className}
      />
    );
  }

  if (failed) {
    if (hideStatus) return null;
    return (
      <ToolStatusChip
        toolName={toolName}
        failed
        className={className}
      />
    );
  }

  if (!hasOutput && kind === "raw") {
    if (hideStatus) return null;
    return (
      <ToolStatusChip toolName={toolName} done className={className} />
    );
  }

  const payload = parseArtifact(toolName, hasOutput ? output : input);

  if (kind === "ui") {
    const spec = specFromPresentUi(hasOutput ? output : input);
    if (spec) {
      return (
        <InlineUiSpec
          spec={spec}
          state={stateFromPresentUi(hasOutput ? output : input)}
          className={className}
        />
      );
    }
  }

  const body = <ArtifactBody payload={payload} />;

  if (hideStatus) {
    return <div className={cn("w-full min-w-0", className)}>{body}</div>;
  }

  return (
    <div className={cn("my-2 w-full min-w-0 space-y-2", className)}>
      <ToolStatusChip toolName={toolName} done compact />
      {body}
    </div>
  );
}

function ArtifactBody({
  payload,
}: {
  payload: ReturnType<typeof parseArtifact>;
}) {
  switch (payload.kind) {
    case "chart":
      return (
        <div className="h-[300px] w-full rounded-[14px] border border-border bg-card p-3">
          <ArtifactChart
            data={payload.payload as ChartPayload}
            className="h-full"
          />
        </div>
      );
    case "card":
      return (
        <div className="rounded-[14px] border border-border bg-card p-4">
          <ArtifactCardView data={payload.payload as CardPayload} />
        </div>
      );
    case "table":
      return (
        <div className="rounded-[14px] border border-border bg-card p-3">
          <ArtifactTable
            {...(payload.payload as TablePayload)}
            className="max-h-[400px]"
          />
        </div>
      );
    case "map":
      return (
        <div className="rounded-lg bg-card p-3 shadow-border">
          <ArtifactMap
            data={payload.payload as MapPayload}
            className="min-h-[300px]"
          />
        </div>
      );
    case "ui":
      return null;
    default:
      return (
        <pre className="max-h-48 overflow-auto rounded-[10px] border border-border bg-muted/40 p-3 font-mono text-xs">
          {JSON.stringify(
            (payload as { payload: unknown }).payload ?? {},
            null,
            2
          )}
        </pre>
      );
  }
}

function ToolStatusChip({
  toolName,
  loading,
  done,
  failed,
  compact,
  className,
}: {
  toolName: string;
  loading?: boolean;
  done?: boolean;
  failed?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const label = toolActivityLabel(toolName, !!loading);

  if (compact && done) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[10px] border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground",
          className
        )}
      >
        <span className="size-1.5 rounded-full bg-foreground" />
        {label}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[10px] border border-border bg-muted/40 text-xs",
        className
      )}
    >
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
        onClick={() => setExpanded((e) => !e)}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-3 shrink-0 animate-spin" />
        ) : (
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              failed ? "bg-muted-foreground" : "bg-foreground"
            )}
          />
        )}
        <span className="flex-1 font-medium text-foreground">{label}</span>
        {!loading && (
          <ChevronRight
            className={cn(
              "size-3 text-muted-foreground transition-transform",
              expanded && "rotate-90"
            )}
          />
        )}
      </button>
    </div>
  );
}

export function isArtifactTool(toolName: string): boolean {
  return classifyToolName(toolName) !== "raw";
}
