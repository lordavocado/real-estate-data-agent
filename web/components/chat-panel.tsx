"use client";

import * as React from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { AssistantTurn } from "@/components/chat/assistant-turn";
import { Button } from "@/components/ui/button";
import type { UseEveChatResult } from "@/hooks/use-eve-chat";
import { isAgentStatus, isChatBusy } from "@/hooks/use-eve-chat-status";
import { groupTurns } from "@/lib/parse-message-parts";
import type { ChatStatus } from "ai";
import { Sparkles, SquarePen } from "lucide-react";
import type { EveMessagePart } from "eve/react";

export interface ChatPanelProps {
  chat: UseEveChatResult;
}

const STARTER_PROMPTS = [
  "Hvad er værdien af en typisk ejerlejlighed på Nørrebro, 75 m²?",
  "Find investmentsejendomme i Aarhus C med cap rate > 6%.",
  "Hvem ejer matriklen Borgergade 24, og hvad er deres CVR-netværk?",
  "Vis AVM-estimat og pris-trend for en villa i Hellerup de sidste 5 år.",
];

export function ChatPanel({ chat }: ChatPanelProps) {
  const isBusy = isChatBusy(chat.status);
  const hasMessages = chat.messages.length > 0;
  const turns = React.useMemo(() => groupTurns(chat.messages), [chat.messages]);
  const noMessages = turns.length === 0;

  const chatStatus: ChatStatus = isAgentStatus(chat.status, "streaming")
    ? "streaming"
    : isAgentStatus(chat.status, "submitted")
      ? "submitted"
      : isAgentStatus(chat.status, "error")
        ? "error"
        : "ready";

  const statusLabel =
    chatStatus === "streaming"
      ? "Thinking & acting…"
      : chatStatus === "submitted"
        ? "Starting…"
        : chatStatus === "error"
          ? "Error"
          : "Ready";

  const sendText = React.useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isBusy) return;
      chat.send({ message: trimmed }).catch((err) => {
        console.error("useEveAgent.send failed:", err);
      });
    },
    [chat, isBusy]
  );

  const handleSubmit = React.useCallback(
    (message: PromptInputMessage) => {
      sendText(message.text);
    },
    [sendText]
  );

  const startNewChat = React.useCallback(() => {
    if (isBusy) chat.stop();
    chat.reset();
  }, [chat, isBusy]);

  return (
    <section className="relative flex h-full min-w-0 flex-1 flex-col">
      <ConversationHeader
        title="Resights AI"
        subtitle="Danish real estate intelligence"
        statusLabel={statusLabel}
        showNewChat={hasMessages}
        onNewChat={startNewChat}
      />

      <div className="relative min-h-0 flex-1">
        <Conversation className="h-full">
          <ConversationContent className="mx-auto w-full max-w-4xl gap-6">
            {noMessages && (
              <ConversationEmptyState
                title="Hej — jeg er Resights AI."
                description="Jeg kan trække live data fra BBR, CVR, Tinglysningen, VUR, Plandata og 10+ andre danske registre. Diagrammer og tabeller renderes inline undervejs."
                icon={<Sparkles className="size-8" />}
              />
            )}

            {turns.map((turn) => (
              <Message from={turn.role} key={turn.key}>
                {turn.role === "user" ? (
                  <UserTurn parts={turn.parts} />
                ) : (
                  <AssistantTurn
                    parts={turn.parts}
                    isActive={turn.isActive}
                    inputDisabled={isBusy}
                    onInputRespond={async (response) => {
                      await chat.send({ inputResponses: [response] });
                    }}
                  />
                )}
              </Message>
            ))}

            {chat.error && (
              <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground">
                <strong>Something went wrong.</strong> {String(chat.error)}
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      <footer className="border-t border-border bg-card/60 p-4">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          {noMessages && (
            <Suggestions className="px-1">
              {STARTER_PROMPTS.map((prompt) => (
                <Suggestion
                  key={prompt}
                  suggestion={prompt}
                  onClick={sendText}
                  className="max-w-xs truncate"
                />
              ))}
            </Suggestions>
          )}

          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              disabled={!isAgentStatus(chat.status, ["ready", "error"])}
              placeholder={
                isBusy
                  ? "Resights AI is working…"
                  : "Ask about a property, market, company, or owner…"
              }
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit
                disabled={!isAgentStatus(chat.status, ["ready", "error"])}
                onStop={chat.stop}
                status={chatStatus}
              />
            </PromptInputFooter>
          </PromptInput>

          <p className="text-center text-xs text-muted-foreground">
            Resights AI can make mistakes. Verify decisions in the land
            registry and CVR.
          </p>
        </div>
      </footer>
    </section>
  );
}

function UserTurn({ parts }: { parts: EveMessagePart[] }) {
  const text = parts
    .filter((p) => (p as { type?: string }).type === "text")
    .map((p) => ((p as { text?: string }).text ?? "").toString())
    .join("");

  if (!text) return null;

  return (
    <MessageContent>
      <MessageResponse>{text}</MessageResponse>
    </MessageContent>
  );
}

function ConversationHeader({
  title,
  subtitle,
  statusLabel,
  showNewChat,
  onNewChat,
}: {
  title: string;
  subtitle: string;
  statusLabel: string;
  showNewChat: boolean;
  onNewChat: () => void;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card/60 px-5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-border bg-muted">
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
