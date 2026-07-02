/**
 * Type alias for the message-shape eve's `defaultMessageReducer` produces.
 * Mirrors the parts[] convention of Vercel AI SDK v5 so we can render with
 * AI-Elements-style components while keeping eve as the source of truth.
 */
import type {
  EveDynamicToolPart,
  EveMessagePart,
} from "eve/react";

export type { EveMessagePart, EveDynamicToolPart };

export type PartKind = EveMessagePart["type"];

export interface TextPart {
  type: "text";
  text: string;
  state?: "streaming" | "done";
}

export interface ReasoningPart {
  type: "reasoning";
  reasoning: string;
  state?: "streaming" | "done";
}

/** Loose helper to read toolCallId whether eve names it callId or toolCallId. */
export function getToolCallId(part: EveDynamicToolPart): string {
  return (
    (part as { toolCallId?: string }).toolCallId ??
    (part as { callId?: string }).callId ??
    ""
  );
}

export function getToolName(part: EveDynamicToolPart): string {
  return (
    (part as { toolName?: string }).toolName ??
    (part as { name?: string }).name ??
    "tool"
  );
}

export function getToolInput(part: EveDynamicToolPart): unknown {
  return (part as { input?: unknown }).input;
}

export function getToolOutput(part: EveDynamicToolPart): unknown {
  return (part as { output?: unknown }).output;
}

export function getToolState(part: EveDynamicToolPart): string {
  return (part as { state?: string }).state ?? "input-available";
}

/** Loose tool part shape shared by message renderers. */
export interface ToolPartLike {
  type: string;
  toolCallId?: string;
  callId?: string;
  toolName?: string;
  name?: string;
  input?: unknown;
  output?: unknown;
  state?:
    | "input-streaming"
    | "input-available"
    | "approval-requested"
    | "output-available"
    | "output-error"
    | "output-denied";
}

export function asToolPart(part: EveMessagePart): ToolPartLike | null {
  const t = (part as { type?: string }).type;
  if (!t) return null;
  if (t === "dynamic-tool" || t.startsWith("tool-")) {
    return part as unknown as ToolPartLike;
  }
  return null;
}

export function readToolName(part: ToolPartLike): string {
  return part.toolName ?? part.name ?? "tool";
}
