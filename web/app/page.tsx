"use client";

import { ChatPanel } from "@/components/chat-panel";
import { useEveChat } from "@/hooks/use-eve-chat";

/**
 * Single-column chat workspace. The canvas artifact pane is disabled for now.
 */
export default function HomePage() {
  const chat = useEveChat();

  return (
    <main className="flex h-screen w-screen bg-background text-foreground overflow-hidden">
      <div className="flex flex-1 flex-col min-w-0">
        <ChatPanel chat={chat} />
      </div>
    </main>
  );
}
