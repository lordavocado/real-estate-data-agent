"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Conversation } from "@/components/chat/conversation";
import { ConversationScrollButton } from "@/components/chat/conversation-scroll-button";
import { Message } from "@/components/chat/message";
import { MessagePart } from "@/components/chat/message-parts";
import { PromptInput } from "@/components/chat/prompt-input";
import { ShimmerMessage } from "@/components/chat/shimmer";
import { Reasoning } from "@/components/chat/reasoning";
import { ActivityRail } from "@/components/chat/activity-rail";
import { Button } from "@/components/ui/button";
import type { EveMessage } from "eve/react";
import type { UseEveChatResult } from "@/hooks/use-eve-chat";
import { isAgentStatus, isChatBusy } from "@/hooks/use-eve-chat-status";
import { asToolPart, type ToolPartLike } from "@/lib/chat-types";
import { SquarePen, Sparkles } from "lucide-react";

export interface ChatPanelProps {
  chat: UseEveChatResult;
}

interface GroupedMessage {
  key: string;
  role: EveMessage["role"];
  author?: string;
  partsRendered: React.ReactNode[];
  hasInFlightReasoning: boolean;
  hasInFlightText: boolean;
}

export function ChatPanel({ chat }: ChatPanelProps) {
  const [input, setInput] = React.useState("");
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const isBusy = isChatBusy(chat.status);
  const hasMessages = chat.messages.length > 0;

  const submit = React.useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isBusy) return;
    setInput("");
    chat.send({ message: trimmed }).catch((err) => {
      console.error("useEveAgent.send failed:", err);
    });
  }, [chat, input, isBusy]);

  const startNewChat = React.useCallback(() => {
    if (isBusy) chat.stop();
    chat.reset();
    setInput("");
  }, [chat, isBusy]);

  const grouped = React.useMemo(
    () => groupMessages(chat.messages),
    [chat.messages]
  );
  const noMessages = grouped.length === 0;

  const statusLabel = isAgentStatus(chat.status, "streaming")
    ? "Thinking & acting…"
    : isAgentStatus(chat.status, "submitted")
      ? "Starting…"
      : isAgentStatus(chat.status, "error")
        ? "Error"
        : "Ready";

  return (
    <section className="relative flex h-full min-w-0 flex-1 flex-col">
      <ConversationHeader
        title="Resights AI"
        subtitle="Danish real estate intelligence · inline dashboards"
        statusLabel={statusLabel}
        showNewChat={hasMessages}
        onNewChat={startNewChat}
        newChatDisabled={false}
      />
      <div className="relative min-h-0 flex-1">
        <Conversation viewportRef={viewportRef}>
          {noMessages && (
            <WelcomeScreen
              onPrompt={(text) => {
                if (isBusy) return;
                chat.send({ message: text }).catch(console.error);
              }}
            />
          )}
          {grouped.map((group) => (
            <Message
              key={group.key}
              role={group.role}
              fromName={group.author}
            >
              {group.partsRendered.map((node, idx) => (
                <React.Fragment key={idx}>{node}</React.Fragment>
              ))}
              {group.hasInFlightReasoning && group.role === "assistant" && (
                <Reasoning
                  reasoningText=""
                  isStreaming
                  className="mt-2"
                />
              )}
              {group.hasInFlightText && (
                <div className="mt-2">
                  <ShimmerMessage />
                </div>
              )}
            </Message>
          ))}
          <AnimatePresence>
            {chat.error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mx-auto max-w-4xl rounded-[10px] border border-border bg-muted px-4 py-3 text-sm text-foreground"
              >
                <strong>Something went wrong.</strong> {String(chat.error)}
              </motion.div>
            )}
          </AnimatePresence>
        </Conversation>
        <ConversationScrollButton containerRef={viewportRef} />
      </div>
      <footer className="border-t border-border bg-card/60 p-4">
        <div className="mx-auto w-full max-w-4xl">
          <PromptInput
            value={input}
            onChange={setInput}
            onSubmit={submit}
            onStop={chat.stop}
            disabled={!isAgentStatus(chat.status, ["ready", "error"])}
            isStreaming={isBusy}
            placeholder={
              isBusy
                ? "Resights AI is working…"
                : "Ask about a property, market, company, or owner…"
            }
          />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Resights AI can make mistakes. Verify decisions in the land
            registry and CVR.
          </p>
        </div>
      </footer>
    </section>
  );
}

function ConversationHeader({
  title,
  subtitle,
  statusLabel,
  showNewChat,
  onNewChat,
  newChatDisabled,
}: {
  title: string;
  subtitle: string;
  statusLabel: string;
  showNewChat: boolean;
  onNewChat: () => void;
  newChatDisabled: boolean;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card/60 px-5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-[10px] border border-border bg-muted">
          <Sparkles className="size-4 text-foreground" />
        </span>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold tracking-tight">
            {title}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {subtitle}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {statusLabel}
        </span>
        {showNewChat && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNewChat}
            disabled={newChatDisabled}
            className="gap-1.5"
          >
            <SquarePen className="size-3.5" />
            New chat
          </Button>
        )}
      </div>
    </header>
  );
}

function WelcomeScreen({ onPrompt }: { onPrompt: (text: string) => void }) {
  const prompts = [
    "Hvad er værdien af en typisk ejerlejlighed på Nørrebro, 75 m²?",
    "Find investmentsejendomme i Aarhus C med cap rate > 6%.",
    "Hvem ejer matriklen Borgergade 24, og hvad er deres CVR-netværk?",
    "Vis AVM-estimat og pris-trend for en villa i Hellerup de sidste 5 år.",
  ];
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-3 pt-12">
      <div className="rounded-[14px] border border-dashed border-border bg-card/50 p-5">
        <h2 className="text-xl font-semibold tracking-tight">
          Hej — jeg er Resights AI.
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Jeg kan trække live data fra BBR, CVR, Tinglysningen, VUR, Plandata
          og 10+ andre danske registre. Tænkning og værktøjskald vises under
          hvert svar — diagrammer og tabeller renderes inline.
        </p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {prompts.map((p, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onPrompt(p)}
              className="w-full rounded-[10px] border border-border bg-card p-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {p}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function groupMessages(messages: readonly EveMessage[]): GroupedMessage[] {
  const out: GroupedMessage[] = [];

  for (const msg of messages) {
    const role = (msg.role as EveMessage["role"]) ?? "assistant";
    const author =
      (msg as { author?: string }).author ??
      (msg as { name?: string }).name ??
      undefined;

    const last = out[out.length - 1];
    if (last && last.role === role && last.author === author) {
      const parts = renderParts(msg.parts ?? [], false);
      last.partsRendered.push(...parts.nodes);
      last.hasInFlightReasoning ||= parts.hasInFlightReasoning;
      last.hasInFlightText ||= parts.hasInFlightText;
      continue;
    }

    const parts = renderParts(msg.parts ?? [], true);
    out.push({
      key: msg.id ?? `${role}-${out.length}`,
      role,
      author,
      partsRendered: parts.nodes,
      hasInFlightReasoning: parts.hasInFlightReasoning,
      hasInFlightText: parts.hasInFlightText,
    });
  }

  return out;
}

function renderParts(
  parts: EveMessage["parts"],
  isLastInGroup: boolean
): {
  nodes: React.ReactNode[];
  hasInFlightReasoning: boolean;
  hasInFlightText: boolean;
} {
  const arr = Array.isArray(parts) ? parts : [];
  const nodes: React.ReactNode[] = [];
  let hasInFlightReasoning = false;
  let hasInFlightText = false;
  let toolBuffer: ToolPartLike[] = [];

  const flushTools = (key: number) => {
    if (!toolBuffer.length) return;
    nodes.push(
      <ActivityRail
        key={`tools-${key}`}
        tools={toolBuffer}
        className="mb-2"
        defaultOpen
      />
    );
    toolBuffer = [];
  };

  arr.forEach((part, i) => {
    const type = (part as { type?: string }).type;
    const tool = asToolPart(part);

    if (type === "reasoning") {
      flushTools(i);
      const text = ((part as { reasoning?: string }).reasoning ?? "").toString();
      const streaming = (part as { state?: string }).state === "streaming";
      hasInFlightReasoning ||= streaming;
      nodes.push(
        <Reasoning
          key={`reasoning-${i}`}
          reasoningText={text}
          isStreaming={streaming && isLastInGroup}
          className="mb-2"
        />
      );
      return;
    }

    if (tool) {
      toolBuffer.push(tool);
      return;
    }

    flushTools(i);

    if (type === "text") {
      const text = ((part as { text?: string }).text ?? "").toString();
      const streaming = (part as { state?: string }).state === "streaming";
      hasInFlightText ||= streaming && !text;
      nodes.push(
        <MessagePart key={`text-${i}`} part={part as never} isLastPart={isLastInGroup} />
      );
      return;
    }

    nodes.push(
      <MessagePart key={`part-${i}`} part={part as never} isLastPart={isLastInGroup} />
    );
  });

  flushTools(arr.length);

  return { nodes, hasInFlightReasoning, hasInFlightText };
}
