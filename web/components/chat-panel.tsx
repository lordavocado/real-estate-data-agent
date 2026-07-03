"use client";

import * as React from "react";
import {
  Conversation,
  ConversationContent,
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
import { SessionMetricsBar } from "@/components/chat/session-metrics-bar";
import { Button } from "@/components/ui/button";
import type { UseEveChatResult } from "@/hooks/use-eve-chat";
import { isAgentStatus, isChatBusy } from "@/hooks/use-eve-chat-status";
import { useSessionMetrics } from "@/hooks/use-session-metrics";
import { groupTurns } from "@/lib/parse-message-parts";
import type { ChatStatus } from "ai";
import { SquarePen, Building2, ChartLine, Network, Search } from "lucide-react";
import type { SessionMetrics } from "@/lib/session-metrics";
import type { EveMessagePart } from "eve/react";

export interface ChatPanelProps {
  chat: UseEveChatResult;
  urlSessionId?: string;
  onNewChatNavigate?: () => void;
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

export function ChatPanel({ chat, urlSessionId, onNewChatNavigate }: ChatPanelProps) {
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

  const metrics = useSessionMetrics({
    events: chat.events,
    messages: chat.messages,
    status: chat.status,
  });

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
    if (urlSessionId && onNewChatNavigate) {
      onNewChatNavigate();
      return;
    }
    chat.reset();
  }, [chat, isBusy, urlSessionId, onNewChatNavigate]);

  const promptInput = (
    <PromptInput onSubmit={handleSubmit}>
      <PromptInputTextarea
        disabled={!isAgentStatus(chat.status, ["ready", "error"])}
        placeholder={
          isBusy
            ? "Real Estate Data Analyst arbejder…"
            : "Spørg om en ejendom, et marked, en virksomhed eller en ejer…"
        }
      />
      <PromptInputFooter className="justify-end px-1 pb-1">
        <PromptInputSubmit
          className="size-9"
          disabled={
            !isBusy && !isAgentStatus(chat.status, ["ready", "error"])
          }
          onStop={chat.stop}
          status={chatStatus}
        />
      </PromptInputFooter>
    </PromptInput>
  );

  return (
    <section className="relative flex h-full min-w-0 flex-1 flex-col">
      <ConversationHeader
        title="Real Estate Data Analyst"
        statusLabel={statusLabel}
        metrics={metrics}
        showNewChat={hasMessages || Boolean(urlSessionId)}
        onNewChat={startNewChat}
      />

      <div className="relative min-h-0 flex-1">
        <Conversation className="h-full">
          <ConversationContent className="mx-auto w-full max-w-3xl gap-5 pb-2">
            {noMessages && (
              <WelcomeMessage onSuggestionClick={sendText} />
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

      <footer className="shrink-0 bg-background px-4 pb-4 pt-3 shadow-header-bottom">
        <div className="mx-auto w-full max-w-3xl">{promptInput}</div>
      </footer>
    </section>
  );
}

function WelcomeMessage({
  onSuggestionClick,
}: {
  onSuggestionClick: (text: string) => void;
}) {
  return (
    <Message from="assistant" className="max-w-full">
      <MessageContent className="max-w-[85%]">
        <MessageResponse>
          {`Hej — jeg er Real Estate Data Analyst.

Jeg kan hjælpe med ejendomsdata, værdiansættelser, ejerskab og markedsanalyse.`}
        </MessageResponse>
      </MessageContent>

      <div className="mt-1 flex w-full max-w-[85%] flex-col gap-2">
        <p className="text-xs text-muted-foreground">Prøv at spørge om</p>
        <Suggestions layout="grid" className="gap-2">
          {STARTER_PROMPTS.map((item) => (
            <Suggestion
              key={item.prompt}
              suggestion={item.prompt}
              label={item.label}
              icon={item.icon}
              layout="compact"
              onClick={onSuggestionClick}
            />
          ))}
        </Suggestions>
      </div>
    </Message>
  );
}

function UserTurn({ parts }: { parts: EveMessagePart[] }) {
  const text = parts
    .filter((p) => (p as { type?: string }).type === "text")
    .map((p) => ((p as { text?: string }).text ?? "").toString())
    .join("");

  if (!text) return null;

  return (
    <MessageContent className="max-w-[85%]">
      <MessageResponse>{text}</MessageResponse>
    </MessageContent>
  );
}

function ConversationHeader({
  title,
  statusLabel,
  metrics,
  showNewChat,
  onNewChat,
}: {
  title: string;
  statusLabel: string;
  metrics: SessionMetrics;
  showNewChat: boolean;
  onNewChat: () => void;
}) {
  return (
    <header className="flex shrink-0 flex-col bg-background shadow-header-bottom">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center">
          <h1 className="truncate text-lg font-semibold tracking-[-0.4px] text-foreground sm:text-xl">
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
      </div>
      <SessionMetricsBar
        metrics={metrics}
        className="px-4 pb-2.5 pt-0 sm:px-6"
      />
    </header>
  );
}
