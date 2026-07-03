"use client";

import { Suspense } from "react";
import { ChatWorkspace } from "@/components/chat-workspace";

/**
 * Single-column chat workspace. Session id in `?s=` enables browser back/forward.
 */
export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground text-sm">
          Loading…
        </main>
      }
    >
      <ChatWorkspace />
    </Suspense>
  );
}
