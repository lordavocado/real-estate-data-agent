"use client";

import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ToolWorkflow } from "./tool-workflow";
import { isAskQuestionPending } from "./ask-question-prompt";
import { parseAssistantParts } from "@/lib/parse-message-parts";
import { isToolAwaitingUser } from "@/lib/tool-labels";
import { getToolState } from "@/lib/chat-types";
import type { EveDynamicToolPart, EveMessagePart } from "eve/react";

export interface AssistantTurnProps {
  parts: EveMessagePart[];
  isActive: boolean;
  onInputRespond?: (response: {
    requestId: string;
    optionId?: string;
    text?: string;
  }) => Promise<void>;
  inputDisabled?: boolean;
}

/**
 * Assistant turn using AI Elements: reasoning → tool workflow → answer.
 */
export function AssistantTurn({
  parts,
  isActive,
  onInputRespond,
  inputDisabled,
}: AssistantTurnProps) {
  const content = parseAssistantParts(parts);
  const awaitingUser = content.tools.some((tool) => {
    const state = getToolState(tool as EveDynamicToolPart);
    return isAskQuestionPending(tool) || isToolAwaitingUser(state);
  });
  const hasReasoning =
    Boolean(content.reasoningText?.trim()) || content.hasInFlightReasoning;
  const reasoningComplete =
    !content.hasInFlightReasoning && Boolean(content.reasoningText?.trim());
  const hasAnswer = Boolean(content.text?.trim());
  const showAnswerPlaceholder =
    content.hasInFlightText && isActive && !hasAnswer;
  const showMessage =
    !awaitingUser &&
    (hasAnswer ||
      showAnswerPlaceholder ||
      !hasReasoning ||
      reasoningComplete);

  return (
    <div className="flex w-full flex-col gap-2">
      {hasReasoning && (
        <Reasoning
          className="w-full"
          isStreaming={content.hasInFlightReasoning && isActive}
          defaultOpen={content.hasInFlightReasoning}
        >
          <ReasoningTrigger />
          {content.reasoningText?.trim() ? (
            <ReasoningContent>{content.reasoningText}</ReasoningContent>
          ) : null}
        </Reasoning>
      )}

      <ToolWorkflow
        tools={content.tools}
        isActive={isActive}
        onInputRespond={onInputRespond}
        inputDisabled={inputDisabled}
      />

      {showMessage && (
        <MessageContent>
          {hasAnswer ? (
            <MessageResponse isAnimating={content.hasInFlightText && isActive}>
              {content.text}
            </MessageResponse>
          ) : showAnswerPlaceholder ? (
            <Shimmer duration={1}>Composing response…</Shimmer>
          ) : null}
        </MessageContent>
      )}
    </div>
  );
}
