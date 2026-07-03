"use client";

import { useEveAgent } from "eve/react";
import type { EveMessage } from "eve/react";
import type {
  HandleMessageStreamEvent,
  SessionState,
} from "eve/client";

export interface UseEveChatOptions {
  host?: string;
  initialSession?: SessionState;
  initialEvents?: readonly HandleMessageStreamEvent[];
  onSessionChange?: (state: SessionState) => void;
}

export interface UseEveChatResult {
  messages: readonly EveMessage[];
  events: ReturnType<typeof useEveAgent>["events"];
  status: ReturnType<typeof useEveAgent>["status"];
  error: ReturnType<typeof useEveAgent>["error"];
  send: ReturnType<typeof useEveAgent>["send"];
  stop: ReturnType<typeof useEveAgent>["stop"];
  reset: ReturnType<typeof useEveAgent>["reset"];
  session: SessionState;
}

/**
 * Wraps eve's `useEveAgent`. The canvas artifact pane is disabled for now.
 * - `host` defaults to the same-origin proxy at `/api/eve`.
 */
export function useEveChat(options: UseEveChatOptions = {}): UseEveChatResult {
  const agent = useEveAgent({
    host: options.host ?? "/api/eve",
    initialSession: options.initialSession,
    initialEvents: options.initialEvents,
    onSessionChange: options.onSessionChange,
  });

  const messages: readonly EveMessage[] =
    (agent.data as { messages?: readonly EveMessage[] })?.messages ?? [];

  return {
    messages,
    events: agent.events,
    status: agent.status,
    error: agent.error,
    send: agent.send,
    stop: agent.stop,
    reset: agent.reset,
    session: agent.session,
  };
}
