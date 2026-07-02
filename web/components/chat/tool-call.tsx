"use client";

import * as React from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { cn, shortToolName } from "@/lib/utils";
import {
  isToolFailed,
  isToolLoading,
  toolActivityLabel,
} from "@/lib/tool-labels";

export interface ToolCallProps {
  toolName: string;
  state: string;
  input?: unknown;
  output?: unknown;
  className?: string;
  /** Rendered below the step header when the tool completes (charts, tables, …). */
  children?: React.ReactNode;
}

/**
 * AI-Elements-style tool invocation row — compact status with optional
 * expandable input/output JSON for debugging and transparency.
 */
export function ToolCall({
  toolName,
  state,
  input,
  output,
  className,
  children,
}: ToolCallProps) {
  const [expanded, setExpanded] = React.useState(false);
  const loading = isToolLoading(state);
  const failed = isToolFailed(state);
  const hasOutput = state === "output-available" && output !== undefined;
  const label = toolActivityLabel(toolName, loading);
  const canExpand = !loading && (input != null || output != null);

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "rounded-[10px] border bg-muted/40 text-xs",
          failed ? "border-border" : "border-border"
        )}
      >
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left"
          onClick={() => canExpand && setExpanded((e) => !e)}
          disabled={!canExpand}
          aria-expanded={expanded}
        >
          {loading ? (
            <Loader2 className="size-3 shrink-0 animate-spin text-foreground" />
          ) : (
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                failed ? "bg-muted-foreground" : "bg-foreground"
              )}
            />
          )}
          <span className="min-w-0 flex-1 font-medium text-foreground">
            {label}
          </span>
          <span className="hidden font-mono text-[0.65rem] text-muted-foreground sm:inline">
            {shortToolName(toolName)}
          </span>
          {canExpand && (
            <ChevronRight
              className={cn(
                "size-3 shrink-0 text-muted-foreground transition-transform",
                expanded && "rotate-90"
              )}
            />
          )}
        </button>
        {expanded && canExpand && (
          <div className="space-y-2 border-t border-border px-3 py-2">
            {input != null && (
              <ToolPayloadBlock title="Input" data={input} />
            )}
            {hasOutput && (
              <ToolPayloadBlock title="Output" data={output} />
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function ToolPayloadBlock({ title, data }: { title: string; data: unknown }) {
  return (
    <div>
      <div className="mb-1 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <pre className="max-h-40 overflow-auto rounded-[4px] border border-border bg-card p-2 font-mono text-[0.68rem] leading-relaxed text-muted-foreground">
        {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
