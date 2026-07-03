"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import { ChatPanel } from "@/components/chat-panel";
import { useEveChat } from "@/hooks/use-eve-chat";
import { fetchEveSessionEvents } from "@/lib/fetch-eve-session-events";

const SESSION_QUERY_KEY = "s";

type ChatBoot = {
  key: string;
  initialSession?: SessionState;
  initialEvents?: readonly HandleMessageStreamEvent[];
};

function ChatSession({
  boot,
  onSessionChange,
  onNewChatNavigate,
}: {
  boot: ChatBoot;
  onSessionChange: (state: SessionState) => void;
  onNewChatNavigate: () => void;
}) {
  const chat = useEveChat({
    initialSession: boot.initialSession,
    initialEvents: boot.initialEvents,
    onSessionChange,
  });

  return (
    <ChatPanel
      chat={chat}
      urlSessionId={boot.initialSession?.sessionId}
      onNewChatNavigate={onNewChatNavigate}
    />
  );
}

export function ChatWorkspace() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSessionId = searchParams.get(SESSION_QUERY_KEY);

  const [boot, setBoot] = React.useState<ChatBoot | null>(null);
  const syncedSessionIdRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!urlSessionId) {
        syncedSessionIdRef.current = undefined;
        setBoot({ key: "new" });
        return;
      }

      try {
        const hydration = await fetchEveSessionEvents(urlSessionId);
        if (cancelled) return;
        syncedSessionIdRef.current = urlSessionId;
        setBoot({
          key: urlSessionId,
          initialEvents: hydration.events,
          initialSession: hydration.session,
        });
      } catch {
        if (cancelled) return;
        syncedSessionIdRef.current = undefined;
        router.replace(pathname, { scroll: false });
        setBoot({ key: "new" });
      }
    }

    setBoot(null);
    void load();

    return () => {
      cancelled = true;
    };
  }, [urlSessionId, pathname, router]);

  const handleSessionChange = React.useCallback(
    (state: SessionState) => {
      const id = state.sessionId;
      if (!id || id === syncedSessionIdRef.current) return;
      syncedSessionIdRef.current = id;
      const params = new URLSearchParams();
      params.set(SESSION_QUERY_KEY, id);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router]
  );

  const handleNewChatNavigate = React.useCallback(() => {
    syncedSessionIdRef.current = undefined;
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  if (!boot) {
    return (
      <main className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground text-sm">
        Loading conversation…
      </main>
    );
  }

  return (
    <main className="flex h-screen w-screen bg-background text-foreground overflow-hidden">
      <div className="flex flex-1 flex-col min-w-0">
        <ChatSession
          key={boot.key}
          boot={boot}
          onSessionChange={handleSessionChange}
          onNewChatNavigate={handleNewChatNavigate}
        />
      </div>
    </main>
  );
}
