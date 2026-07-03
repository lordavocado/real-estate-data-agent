"use client";

import * as React from "react";
import { MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EveDynamicToolPart } from "eve/react";
import type { ToolPartLike } from "@/lib/chat-types";
import { getToolInput, getToolState } from "@/lib/chat-types";

export interface AskQuestionPromptProps {
  part: ToolPartLike;
  onRespond: (response: { optionId?: string; text?: string }) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

interface AskQuestionInput {
  prompt?: string;
  options?: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  allowFreeform?: boolean;
}

/**
 * Renders eve's `ask_question` HITL prompt with tappable options.
 */
export function AskQuestionPrompt({
  part,
  onRespond,
  disabled = false,
  className,
}: AskQuestionPromptProps) {
  const [freeform, setFreeform] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const evePart = part as EveDynamicToolPart;
  const input = getToolInput(evePart) as AskQuestionInput | undefined;
  const inputRequest = evePart.toolMetadata?.eve?.inputRequest;
  const approvalId = (evePart as { approval?: { id: string } }).approval?.id;

  const prompt = inputRequest?.prompt ?? input?.prompt ?? "";
  const options = inputRequest?.options ?? input?.options ?? [];
  const allowFreeform =
    inputRequest?.allowFreeform ?? input?.allowFreeform ?? true;
  const requestId = inputRequest?.requestId ?? approvalId;
  const state = getToolState(evePart);

  if (!prompt) {
    if (state === "input-streaming") {
      return (
        <p className="mt-2 text-sm text-muted-foreground">Preparing question…</p>
      );
    }
    return null;
  }

  if (state !== "approval-requested" && state !== "input-available") {
    return null;
  }

  const submit = async (payload: { optionId?: string; text?: string }) => {
    if (!requestId || submitting || disabled) return;
    setSubmitting(true);
    try {
      await onRespond(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "mt-1 rounded-lg bg-muted/40 p-3 shadow-border",
        className
      )}
    >
      <div className="mb-2 flex items-start gap-2">
        <MessageCircleQuestion className="mt-0.5 size-3.5 shrink-0 text-foreground" />
        <p className="text-xs leading-relaxed text-foreground">{prompt}</p>
      </div>

      {options.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {options.map((opt) => (
            <Button
              key={opt.id}
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || submitting}
              className="h-auto min-h-8 justify-start whitespace-normal px-2.5 py-1.5 text-left text-xs"
              onClick={() => submit({ optionId: opt.id })}
            >
              <span className="font-medium">{opt.label}</span>
              {opt.description && (
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  {opt.description}
                </span>
              )}
            </Button>
          ))}
        </div>
      )}

      {allowFreeform && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const text = freeform.trim();
            if (!text) return;
            void submit({ text });
          }}
        >
          <input
            type="text"
            value={freeform}
            onChange={(e) => setFreeform(e.target.value)}
            disabled={disabled || submitting}
            placeholder="Or type your answer…"
            className="min-w-0 flex-1 rounded-[10px] border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground"
          />
          <Button
            type="submit"
            size="sm"
            disabled={disabled || submitting || !freeform.trim()}
          >
            Send
          </Button>
        </form>
      )}
    </div>
  );
}

export function isAskQuestionTool(part: ToolPartLike): boolean {
  const name = part.toolName ?? part.name ?? "";
  return name === "ask_question";
}

export function isAskQuestionPending(part: ToolPartLike): boolean {
  if (!isAskQuestionTool(part)) return false;
  const state = getToolState(part as EveDynamicToolPart);
  return state === "approval-requested" || state === "input-available";
}
