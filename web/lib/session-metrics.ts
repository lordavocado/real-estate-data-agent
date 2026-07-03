import type { HandleMessageStreamEvent } from "eve/client";
import type { EveMessage } from "eve/react";

export interface TokenUsage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  total: number;
}

export interface SessionMetrics {
  sessionDurationMs: number;
  lastTurnDurationMs: number | null;
  tokens: TokenUsage;
  modelSteps: number;
  toolCalls: number;
  completedTurns: number;
  userMessages: number;
  isActiveTurn: boolean;
  hasActivity: boolean;
}

function eventAt(event: HandleMessageStreamEvent): number | null {
  const at = event.meta?.at;
  if (!at) return null;
  const ms = Date.parse(at);
  return Number.isFinite(ms) ? ms : null;
}

function sumStepUsage(events: readonly HandleMessageStreamEvent[]): TokenUsage {
  let input = 0;
  let output = 0;
  let cacheRead = 0;
  let cacheWrite = 0;

  for (const event of events) {
    if (event.type !== "step.completed") continue;
    const usage = event.data.usage;
    if (!usage) continue;
    input += usage.inputTokens ?? 0;
    output += usage.outputTokens ?? 0;
    cacheRead += usage.cacheReadTokens ?? 0;
    cacheWrite += usage.cacheWriteTokens ?? 0;
  }

  return {
    input,
    output,
    cacheRead,
    cacheWrite,
    total: input + output,
  };
}

function countUserMessages(messages: readonly EveMessage[]): number {
  return messages.filter((m) => m.role === "user").length;
}

function findLastTurnStart(events: readonly HandleMessageStreamEvent[]): number | null {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i]!.type === "turn.started") {
      return eventAt(events[i]!) ?? null;
    }
  }
  return null;
}

function findLastTurnEnd(events: readonly HandleMessageStreamEvent[]): number | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const type = events[i]!.type;
    if (type === "turn.completed" || type === "turn.failed") {
      return eventAt(events[i]!) ?? null;
    }
  }
  return null;
}

function findSessionStart(events: readonly HandleMessageStreamEvent[]): number | null {
  for (const event of events) {
    const at = eventAt(event);
    if (at !== null) return at;
  }
  return null;
}

function findSessionEnd(
  events: readonly HandleMessageStreamEvent[],
  nowMs: number,
  isActiveTurn: boolean
): number {
  if (isActiveTurn) return nowMs;
  for (let i = events.length - 1; i >= 0; i--) {
    const at = eventAt(events[i]!);
    if (at !== null) return at;
  }
  return nowMs;
}

export function computeSessionMetrics(input: {
  events: readonly HandleMessageStreamEvent[];
  messages: readonly EveMessage[];
  isActiveTurn: boolean;
  nowMs?: number;
}): SessionMetrics {
  const nowMs = input.nowMs ?? Date.now();
  const { events, messages, isActiveTurn } = input;

  const tokens = sumStepUsage(events);
  const modelSteps = events.filter((e) => e.type === "step.completed").length;
  const toolCalls = events.filter((e) => e.type === "action.result").length;
  const completedTurns = events.filter((e) => e.type === "turn.completed").length;
  const userMessages = countUserMessages(messages);

  const sessionStart = findSessionStart(events);
  const sessionEnd = findSessionEnd(events, nowMs, isActiveTurn);
  const sessionDurationMs =
    sessionStart !== null ? Math.max(0, sessionEnd - sessionStart) : 0;

  const turnStart = findLastTurnStart(events);
  const turnEnd = isActiveTurn ? nowMs : findLastTurnEnd(events);
  const lastTurnDurationMs =
    turnStart !== null && turnEnd !== null
      ? Math.max(0, turnEnd - turnStart)
      : null;

  const hasActivity =
    userMessages > 0 ||
    completedTurns > 0 ||
    tokens.total > 0 ||
    toolCalls > 0;

  return {
    sessionDurationMs,
    lastTurnDurationMs,
    tokens,
    modelSteps,
    toolCalls,
    completedTurns,
    userMessages,
    isActiveTurn,
    hasActivity,
  };
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.max(0, Math.round(ms))}ms`;
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
}

export function formatTokenCount(value: number): string {
  if (value < 1_000) return value.toLocaleString("en-US");
  if (value < 1_000_000) {
    const compact = value / 1_000;
    return `${compact >= 10 ? Math.round(compact) : compact.toFixed(1).replace(/\.0$/, "")}k`;
  }
  const compact = value / 1_000_000;
  return `${compact >= 10 ? Math.round(compact) : compact.toFixed(1).replace(/\.0$/, "")}M`;
}
