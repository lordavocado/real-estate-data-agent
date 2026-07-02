"use client";

import * as React from "react";
import { ChevronDown, Brain } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ReasoningProps {
  reasoningText: string;
  isStreaming?: boolean;
  defaultOpen?: boolean;
  className?: string;
  /** How long we keep the block mounted after streaming stops. */
  exitDelayMs?: number;
}

/**
 * Collapsible "thinking steps" rail. Renders a shimmer placeholder while
 * `reasoningText` is empty AND `isStreaming` is true, then expands live as
 * text arrives. Stays expanded for ~700ms after streaming stops so the user
 * can read the final reasoning, then auto-collapses (but stays mounted).
 */
export function Reasoning({
  reasoningText,
  isStreaming = false,
  defaultOpen = true,
  className,
}: ReasoningProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  React.useEffect(() => {
    if (isStreaming) setOpen(true);
  }, [isStreaming]);

  // Idle with no content — render nothing.
  const hasContent = !!reasoningText?.trim();
  if (!hasContent && !isStreaming) {
    return null;
  }

  const placeholderVisible = !hasContent && isStreaming;

  return (
    <AnimatePresence initial={false}>
      {(hasContent || isStreaming) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className={cn(
            "rounded-[10px] border border-dashed border-border bg-muted/40 text-sm",
            className
          )}
        >
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-muted-foreground hover:bg-muted/60 transition-colors"
            aria-expanded={open}
          >
            <Brain className="size-3.5 shrink-0" />
            <span className="text-xs font-medium uppercase tracking-wide">
              {isStreaming ? "Thinking…" : "Reasoning"}
            </span>
            {isStreaming && (
              <span
                className="ml-1 inline-flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
                aria-hidden
              />
            )}
            <ChevronDown
              className={cn(
                "ml-auto size-3.5 transition-transform",
                open && "rotate-180"
              )}
            />
          </button>
          {open && (
            <div className="px-3 pb-3 font-mono text-[0.78rem] leading-relaxed text-muted-foreground whitespace-pre-wrap markdown-body">
              {placeholderVisible ? <ThinkingSkeleton /> : reasoningText}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Three animated bars that suggest "thinking" streaming. */
function ThinkingSkeleton() {
  return (
    <div className="flex flex-col gap-1.5" aria-hidden>
      <span className="shimmer h-3 w-11/12 rounded-[4px]" />
      <span className="shimmer h-3 w-9/12 rounded-[4px]" />
      <span className="shimmer h-3 w-7/12 rounded-[4px]" />
    </div>
  );
}
