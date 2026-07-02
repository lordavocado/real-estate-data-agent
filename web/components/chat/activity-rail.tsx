"use client";

import * as React from "react";
import { ListTree } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolCall } from "./tool-call";
import { InlineArtifact, isArtifactTool } from "./inline-artifact";
import { asToolPart, readToolName, type ToolPartLike } from "@/lib/chat-types";
import { getToolInput, getToolOutput, getToolState } from "@/lib/chat-types";

export interface ActivityRailProps {
  tools: ToolPartLike[];
  className?: string;
  defaultOpen?: boolean;
}

/**
 * Collapsible vertical rail listing agent tool steps in execution order.
 * Artifact tools render their inline UI beneath each completed step.
 */
export function ActivityRail({
  tools,
  className,
  defaultOpen = true,
}: ActivityRailProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const anyLoading = tools.some((t) => {
    const s = getToolState(t as import("eve/react").EveDynamicToolPart);
    return s === "input-streaming" || s === "input-available";
  });

  if (!tools.length) return null;

  return (
    <div
      className={cn(
        "rounded-[10px] border border-border bg-muted/30 text-sm",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-muted-foreground hover:bg-muted/50 transition-colors"
        aria-expanded={open}
      >
        <ListTree className="size-3.5 shrink-0" />
        <span className="text-xs font-medium uppercase tracking-wide text-foreground">
          Agent activity
        </span>
        <span className="text-xs text-muted-foreground">
          {tools.length} step{tools.length === 1 ? "" : "s"}
        </span>
        {anyLoading && (
          <span
            className="ml-1 size-1.5 animate-pulse rounded-full bg-foreground"
            aria-hidden
          />
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open && (
        <ol className="space-y-2 border-t border-border px-3 py-3">
          {tools.map((part, i) => {
            const name = readToolName(part);
            const state = getToolState(part as import("eve/react").EveDynamicToolPart);
            const input = getToolInput(part as import("eve/react").EveDynamicToolPart);
            const output = getToolOutput(part as import("eve/react").EveDynamicToolPart);
            const isArtifact = isArtifactTool(name);
            const hasOutput =
              state === "output-available" && output !== undefined;

            return (
              <li key={part.toolCallId ?? part.callId ?? i} className="list-none">
                {isArtifact ? (
                  <div className="space-y-2">
                    <ToolCall
                      toolName={name}
                      state={state}
                      input={input}
                      output={hasOutput ? output : undefined}
                    />
                    {hasOutput && (
                      <InlineArtifact
                        toolName={name}
                        state={state}
                        input={input}
                        output={output}
                        hideStatus
                      />
                    )}
                  </div>
                ) : (
                  <ToolCall
                    toolName={name}
                    state={state}
                    input={input}
                    output={output}
                  />
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
