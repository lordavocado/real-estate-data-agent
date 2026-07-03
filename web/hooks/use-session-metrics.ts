"use client";

import * as React from "react";
import type { HandleMessageStreamEvent } from "eve/client";
import type { EveMessage } from "eve/react";
import {
  computeSessionMetrics,
  type SessionMetrics,
} from "@/lib/session-metrics";
import { isChatBusy } from "@/hooks/use-eve-chat-status";

export function useSessionMetrics(input: {
  events: readonly HandleMessageStreamEvent[];
  messages: readonly EveMessage[];
  status: string;
}): SessionMetrics {
  const isActiveTurn = isChatBusy(input.status);
  const [nowMs, setNowMs] = React.useState(() => Date.now());
  const clientSessionStartRef = React.useRef<number | null>(null);

  const hasUserMessages = input.messages.some((m) => m.role === "user");
  if (hasUserMessages && clientSessionStartRef.current === null) {
    clientSessionStartRef.current = Date.now();
  }
  if (!hasUserMessages) {
    clientSessionStartRef.current = null;
  }

  React.useEffect(() => {
    if (!hasUserMessages) {
      setNowMs(Date.now());
      return;
    }

    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [hasUserMessages, isActiveTurn, input.events.length, input.status]);

  return React.useMemo(() => {
    const metrics = computeSessionMetrics({
      events: input.events,
      messages: input.messages,
      isActiveTurn,
      nowMs,
    });

    if (
      metrics.sessionDurationMs === 0 &&
      clientSessionStartRef.current !== null
    ) {
      return {
        ...metrics,
        sessionDurationMs: Math.max(0, nowMs - clientSessionStartRef.current),
        hasActivity: true,
      };
    }

    return metrics;
  }, [input.events, input.messages, isActiveTurn, nowMs]);
}
