import type { EveMessage, EveMessagePart } from "eve/react";
import {
  asToolPart,
  getToolState,
  type ToolPartLike,
} from "@/lib/chat-types";

export interface ParsedAssistantContent {
  reasoningText: string;
  hasInFlightReasoning: boolean;
  tools: ToolPartLike[];
  text: string;
  hasInFlightText: boolean;
}

/** Flatten all parts from an assistant turn into one structured view. */
export function parseAssistantParts(
  parts: readonly EveMessagePart[]
): ParsedAssistantContent {
  const reasoningChunks: string[] = [];
  const tools: ToolPartLike[] = [];
  const textChunks: string[] = [];
  let hasInFlightReasoning = false;
  let hasInFlightText = false;

  for (const part of parts) {
    const type = (part as { type?: string }).type;

    if (type === "reasoning") {
      const text = ((part as { reasoning?: string }).reasoning ?? "").toString();
      if (text.trim()) reasoningChunks.push(text);
      if ((part as { state?: string }).state === "streaming") {
        hasInFlightReasoning = true;
      }
      continue;
    }

    const tool = asToolPart(part);
    if (tool) {
      tools.push(tool);
      continue;
    }

    if (type === "text") {
      const text = ((part as { text?: string }).text ?? "").toString();
      const streaming = (part as { state?: string }).state === "streaming";
      if (text) textChunks.push(text);
      if (streaming && !text) hasInFlightText = true;
    }
  }

  return {
    reasoningText: reasoningChunks.join("\n\n"),
    hasInFlightReasoning,
    tools,
    text: textChunks.join(""),
    hasInFlightText,
  };
}

export function countToolStates(tools: ToolPartLike[]) {
  let loading = 0;
  let done = 0;
  let failed = 0;
  let awaiting = 0;
  for (const tool of tools) {
    const state = getToolState(tool as import("eve/react").EveDynamicToolPart);
    if (state === "input-streaming" || state === "input-available") loading++;
    else if (state === "approval-requested") awaiting++;
    else if (state === "output-error" || state === "output-denied") failed++;
    else done++;
  }
  return { loading, done, failed, awaiting, total: tools.length };
}

export function isPartStreaming(parts: readonly EveMessagePart[]): boolean {
  return parts.some((part) => {
    const type = (part as { type?: string }).type;
    const state = (part as { state?: string }).state;
    if (type === "reasoning" || type === "text") return state === "streaming";
    const tool = asToolPart(part);
    if (tool) {
      const s = getToolState(tool as import("eve/react").EveDynamicToolPart);
      return s === "input-streaming" || s === "input-available";
    }
    return false;
  });
}

export type GroupedTurn = {
  key: string;
  role: EveMessage["role"];
  author?: string;
  parts: EveMessagePart[];
  isActive: boolean;
};

/** Merge consecutive messages from the same role into one turn. */
export function groupTurns(messages: readonly EveMessage[]): GroupedTurn[] {
  const out: GroupedTurn[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]!;
    const role = (msg.role as EveMessage["role"]) ?? "assistant";
    const author =
      (msg as { author?: string }).author ??
      (msg as { name?: string }).name ??
      undefined;
    const msgParts = Array.isArray(msg.parts) ? [...msg.parts] : [];
    const isLastMessage = i === messages.length - 1;

    const last = out[out.length - 1];
    if (last && last.role === role && last.author === author) {
      last.parts.push(...msgParts);
      last.isActive = isLastMessage;
      continue;
    }

    out.push({
      key: msg.id ?? `${role}-${out.length}`,
      role,
      author,
      parts: msgParts,
      isActive: isLastMessage,
    });
  }

  return out;
}
