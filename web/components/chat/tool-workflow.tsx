"use client";

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  Queue,
  QueueItem,
  QueueList,
} from "@/components/ai-elements/queue";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { AskQuestionPrompt, isAskQuestionPending, isAskQuestionTool } from "./ask-question-prompt";
import { InlineArtifact, isArtifactTool } from "./inline-artifact";
import {
  getToolInput,
  getToolOutput,
  getToolState,
  readToolName,
  type ToolPartLike,
} from "@/lib/chat-types";
import { countToolStates } from "@/lib/parse-message-parts";
import {
  isToolAwaitingUser,
  isToolFailed,
  isToolLoading,
  toolActivityLabel,
} from "@/lib/tool-labels";
import type { EveDynamicToolPart } from "eve/react";
import type { DynamicToolUIPart, ToolUIPart } from "ai";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2Icon,
  Loader2Icon,
  MessageCircleQuestionIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";

export interface ToolWorkflowProps {
  tools: ToolPartLike[];
  isActive: boolean;
  onInputRespond?: (response: {
    requestId: string;
    optionId?: string;
    text?: string;
  }) => Promise<void>;
  inputDisabled?: boolean;
}

function stepStatus(
  state: string,
  needsUser = false
): "complete" | "active" | "pending" {
  if (isToolLoading(state) || isToolAwaitingUser(state) || needsUser) return "active";
  return "complete";
}

function stepIcon(state: string): LucideIcon {
  if (isToolFailed(state)) return XCircleIcon;
  if (isToolAwaitingUser(state)) return MessageCircleQuestionIcon;
  if (isToolLoading(state)) return Loader2Icon;
  if (state === "output-available" || state === "approval-responded") {
    return CheckCircle2Icon;
  }
  return WrenchIcon;
}

function workflowHeader(
  counts: ReturnType<typeof countToolStates>,
  isActive: boolean
): ReactNode {
  if (counts.loading > 0 || (isActive && counts.awaiting === 0 && counts.loading === 0 && counts.done < counts.total)) {
    return <Shimmer duration={1}>Working through steps…</Shimmer>;
  }
  if (counts.awaiting > 0) {
    return "Waiting for your input";
  }
  if (counts.failed > 0) {
    return `Completed ${counts.done} of ${counts.total} steps (${counts.failed} failed)`;
  }
  if (counts.total === 1) {
    return "Completed 1 step";
  }
  return `Completed ${counts.total} steps`;
}

/**
 * Tool activity rail: Chain of Thought (collapsible) + Queue (scrollable step list).
 */
export function ToolWorkflow({
  tools,
  isActive,
  onInputRespond,
  inputDisabled,
}: ToolWorkflowProps) {
  if (tools.length === 0) return null;

  const counts = countToolStates(tools);
  const hasActiveWork =
    counts.loading > 0 ||
    counts.awaiting > 0 ||
    (isActive && counts.done < counts.total);

  return (
    <ChainOfThought
      className="mb-2"
      defaultOpen={hasActiveWork || !isActive}
    >
      <ChainOfThoughtHeader>{workflowHeader(counts, isActive)}</ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        <Queue className="border-0 bg-transparent px-0 py-0 shadow-none">
          <QueueList bounded={false} className="mt-0">
            {tools.map((part, index) => (
              <QueueItem
                key={part.toolCallId ?? part.callId ?? index}
                className="rounded-[10px] px-1 py-0 hover:bg-transparent"
              >
                <ToolWorkflowStep
                  part={part}
                  onInputRespond={onInputRespond}
                  inputDisabled={inputDisabled}
                />
              </QueueItem>
            ))}
          </QueueList>
        </Queue>
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
}

function ToolWorkflowStep({
  part,
  onInputRespond,
  inputDisabled,
}: {
  part: ToolPartLike;
  onInputRespond?: ToolWorkflowProps["onInputRespond"];
  inputDisabled?: boolean;
}) {
  const evePart = part as EveDynamicToolPart;
  const state = getToolState(evePart) as ToolUIPart["state"];
  const name = readToolName(part);
  const input = getToolInput(evePart);
  const output = getToolOutput(evePart);
  const loading = isToolLoading(state);
  const isAskQuestion = isAskQuestionTool(part);
  const isAskQuestionActive = isAskQuestionPending(part);
  const isArtifact = isArtifactTool(name);
  const hasOutput = state === "output-available" && output !== undefined;
  const failed = isToolFailed(state);
  const Icon = stepIcon(state);
  const label = toolActivityLabel(name, loading, state);
  const errorText =
    state === "output-error"
      ? String(
          (evePart as { errorText?: string }).errorText ??
            output ??
            "Tool failed"
        )
      : undefined;

  const showToolDetails = !isAskQuestion && !isArtifact;
  const hasExpandableContent =
    showToolDetails ||
    isAskQuestionActive ||
    (isArtifact && (loading || hasOutput || failed));

  return (
    <ChainOfThoughtStep
      icon={Icon}
      defaultOpen={loading || isAskQuestionActive}
      label={
        <span className="flex items-center gap-2">
          {loading && (
            <Loader2Icon className="size-3.5 shrink-0 animate-spin" />
          )}
          {label}
        </span>
      }
      description={failed && !hasExpandableContent ? errorText : undefined}
      status={stepStatus(state, isAskQuestionActive)}
    >
      {isAskQuestionActive && onInputRespond && (
        <AskQuestionPrompt
          part={part}
          disabled={inputDisabled}
          onRespond={async (payload) => {
            const requestId =
              evePart.toolMetadata?.eve?.inputRequest?.requestId ??
              (evePart as { approval?: { id: string } }).approval?.id;
            if (!requestId) return;
            await onInputRespond({ requestId, ...payload });
          }}
        />
      )}

      {isArtifact && (loading || hasOutput || failed) && (
        <InlineArtifact
          toolName={name}
          state={state}
          input={input}
          output={output}
          hideStatus
        />
      )}

      {showToolDetails && (
        <div className="mt-1 space-y-3 rounded-md border border-border bg-muted/30 p-3">
          {input != null && <ToolInput input={input} />}
          <ToolOutput
            output={output}
            errorText={errorText as DynamicToolUIPart["errorText"]}
          />
        </div>
      )}
    </ChainOfThoughtStep>
  );
}
