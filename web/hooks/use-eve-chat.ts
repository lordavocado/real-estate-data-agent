"use client";

import { useEveAgent } from "eve/react";
import type { EveMessage } from "eve/react";

export interface UseEveChatResult {
  messages: readonly EveMessage[];
  status: ReturnType<typeof useEveAgent>["status"];
  error: ReturnType<typeof useEveAgent>["error"];
  send: ReturnType<typeof useEveAgent>["send"];
  stop: ReturnType<typeof useEveAgent>["stop"];
  reset: ReturnType<typeof useEveAgent>["reset"];
}

/**
 * Wraps eve's `useEveAgent`. The canvas artifact pane is disabled for now.
 * - `host` defaults to the same-origin proxy at `/api/eve`.
 */
export function useEveChat(options?: { host?: string }): UseEveChatResult {
  const agent = useEveAgent({
    host: options?.host ?? "/api/eve",
  });

  const messages: readonly EveMessage[] =
    (agent.data as { messages?: readonly EveMessage[] })?.messages ?? [];

  return {
    messages,
    status: agent.status,
    error: agent.error,
    send: agent.send,
    stop: agent.stop,
    reset: agent.reset,
  };
}
