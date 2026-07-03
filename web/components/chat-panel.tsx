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
import { Sparkles, SquarePen, Building2, ChartLine, Network, Search } from "lucide-react";
import type { EveMessagePart } from "eve/react";

export interface ChatPanelProps {
  chat: UseEveChatResult;
}

const STARTER_PROMPTS = [
  {
    label: "Ejendomsværdi",
    prompt: "Hvad er værdien af en typisk ejerlejlighed på Nørrebro, 75 m²?",
    icon: Building2,
  },
  {
    label: "Investering",
    prompt: "Find investmentsejendomme i Aarhus C med cap rate > 6%.",
    icon: Search,
  },
  {
    label: "Ejerskab & CVR",
    prompt: "Hvem ejer matriklen Borgergade 24, og hvad er deres CVR-netværk?",
    icon: Network,
  },
  {
    label: "Prisudvikling",
    prompt: "Vis AVM-estimat og pris-trend for en villa i Hellerup de sidste 5 år.",
    icon: ChartLine,
  },
] as const;

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
                description=""
                titleClassName="text-2xl font-semibold tracking-[-0.4px] text-foreground"
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
              <div className="rounded-md bg-muted px-4 py-3 text-sm text-foreground shadow-border">
                <strong>Something went wrong.</strong> {String(chat.error)}
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      <footer className="bg-background p-4 shadow-header-bottom">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          {noMessages && (
            <div className="flex flex-col gap-2">
              <p className="px-0.5 text-xs text-muted-foreground">
                Prøv at spørge om
              </p>
              <Suggestions layout="grid">
                {STARTER_PROMPTS.map((item) => (
                  <Suggestion
                    key={item.prompt}
                    suggestion={item.prompt}
                    label={item.label}
                    icon={item.icon}
                    layout="card"
                    onClick={sendText}
                  />
                ))}
              </Suggestions>
            </div>
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
                disabled={
                  !isBusy &&
                  !isAgentStatus(chat.status, ["ready", "error"])
                }
                onStop={chat.stop}
                status={chatStatus}
              />
            </PromptInputFooter>
          </PromptInput>
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
  statusLabel,
  showNewChat,
  onNewChat,
}: {
  title: string;
  statusLabel: string;
  showNewChat: boolean;
  onNewChat: () => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 bg-background px-6 shadow-header-bottom">
      <div className="flex min-w-0 items-center">
        <h1 className="truncate text-xl font-semibold tracking-[-0.4px] text-foreground">
          {title}
        </h1>
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
