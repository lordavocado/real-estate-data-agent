"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatDuration,
  formatTokenCount,
  type SessionMetrics,
} from "@/lib/session-metrics";
import { cn } from "@/lib/utils";
import {
  Clock,
  Coins,
  Layers,
  MessageSquare,
  Timer,
  Wrench,
} from "lucide-react";

export interface SessionMetricsBarProps {
  metrics: SessionMetrics;
  className?: string;
}

export function SessionMetricsBar({ metrics, className }: SessionMetricsBarProps) {
  if (!metrics.hasActivity) return null;

  const tokenDetail = [
    metrics.tokens.input > 0 ? `${formatTokenCount(metrics.tokens.input)} in` : null,
    metrics.tokens.output > 0 ? `${formatTokenCount(metrics.tokens.output)} out` : null,
    metrics.tokens.cacheRead > 0
      ? `${formatTokenCount(metrics.tokens.cacheRead)} cache read`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const items = [
    {
      key: "session",
      icon: Clock,
      label: formatDuration(metrics.sessionDurationMs),
      title: "Session duration",
      detail: "Elapsed time since the conversation started.",
    },
    metrics.lastTurnDurationMs !== null
      ? {
          key: "turn",
          icon: Timer,
          label: formatDuration(metrics.lastTurnDurationMs),
          title: metrics.isActiveTurn ? "Current turn" : "Last turn",
          detail: metrics.isActiveTurn
            ? "Time spent on the active turn so far."
            : "Duration of the most recent completed turn.",
        }
      : null,
    metrics.tokens.total > 0
      ? {
          key: "tokens",
          icon: Coins,
          label: formatTokenCount(metrics.tokens.total),
          title: "Token usage",
          detail: tokenDetail || "Cumulative model tokens for this session.",
        }
      : null,
    metrics.toolCalls > 0
      ? {
          key: "tools",
          icon: Wrench,
          label: String(metrics.toolCalls),
          title: "Tool calls",
          detail: "API lookups, calculations, and presentations invoked.",
        }
      : null,
    metrics.modelSteps > 0
      ? {
          key: "steps",
          icon: Layers,
          label: String(metrics.modelSteps),
          title: "Model steps",
          detail: "Individual model calls in the agent loop.",
        }
      : null,
    metrics.userMessages > 0
      ? {
          key: "messages",
          icon: MessageSquare,
          label: String(metrics.userMessages),
          title: "Your messages",
          detail: `${metrics.completedTurns} completed turn${metrics.completedTurns === 1 ? "" : "s"}.`,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <TooltipProvider delay={300}>
      <div
        className={cn(
          "flex min-w-0 flex-wrap items-center justify-center gap-1.5",
          className
        )}
        aria-label="Session metrics"
      >
        {items.map((item) => (
          <Tooltip key={item.key}>
            <TooltipTrigger
              render={
                <Badge
                  variant="secondary"
                  className="h-6 gap-1 rounded-md px-2 font-normal text-secondary-foreground tabular-nums"
                />
              }
            >
              <item.icon className="size-3 shrink-0 opacity-70" aria-hidden />
              <span className="text-[11px] leading-none">{item.label}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-left">
              <p className="font-medium">{item.title}</p>
              <p className="text-background/80">{item.detail}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
