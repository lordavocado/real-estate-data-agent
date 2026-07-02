"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { InlineArtifact, isArtifactTool } from "./inline-artifact";
import { ToolCall } from "./tool-call";
import { Reasoning } from "./reasoning";
import { Shimmer } from "./shimmer";
import { cn } from "@/lib/utils";
import {
  getToolInput,
  getToolName,
  getToolOutput,
  getToolState,
  type ToolPartLike,
} from "@/lib/chat-types";
import type { EveDynamicToolPart } from "eve/react";

interface TextPart {
  type: "text";
  text: string;
  state?: "streaming" | "done";
}

export interface MessagePartProps {
  part:
    | TextPart
    | ToolPartLike
    | { type: string } & Record<string, unknown>;
  isLastPart?: boolean;
}

/**
 * Renders one EveMessagePart. Tool parts are normally grouped in
 * `ActivityRail` by `chat-panel.tsx`; this handles text and fallbacks.
 */
export function MessagePart({ part, isLastPart }: MessagePartProps) {
  if (part.type === "text") {
    return <TextBlock part={part as TextPart} />;
  }
  if (part.type === "reasoning") {
    const p = part as { reasoning?: string; state?: string };
    return (
      <Reasoning
        reasoningText={(p.reasoning ?? "").toString()}
        isStreaming={p.state === "streaming" && !!isLastPart}
        className="mb-2"
      />
    );
  }
  if (part.type === "dynamic-tool" || part.type?.startsWith?.("tool-")) {
    return <StandaloneToolPart part={part as ToolPartLike} />;
  }
  return null;
}

export { Reasoning };

function TextBlock({ part }: { part: TextPart }) {
  const isStreaming = part.state === "streaming";
  return (
    <div className={cn("markdown-body text-sm", isStreaming && "streaming-text")}>
      {isStreaming && !part.text ? (
        <Shimmer width="60%" />
      ) : (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {part.text ?? ""}
        </ReactMarkdown>
      )}
    </div>
  );
}

/** Fallback when a tool part is not batched into ActivityRail. */
function StandaloneToolPart({ part }: { part: ToolPartLike }) {
  const evePart = part as EveDynamicToolPart;
  const name = getToolName(evePart);
  const state = getToolState(evePart);
  const input = getToolInput(evePart);
  const output = getToolOutput(evePart);

  if (isArtifactTool(name)) {
    return (
      <InlineArtifact
        toolName={name}
        state={state}
        input={input}
        output={output}
      />
    );
  }

  return (
    <ToolCall
      toolName={name}
      state={state}
      input={input}
      output={output}
      className="my-2"
    />
  );
}
