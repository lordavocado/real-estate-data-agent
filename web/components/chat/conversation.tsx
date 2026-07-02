"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface ConversationProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "dir"> {
  /** Receives the scrollable viewport element for scroll-to-bottom controls. */
  viewportRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Vertical scroll container for chat messages. Auto-scrolls to the newest
 * message unless the user has scrolled up. Equivalent to Vercel's
 * `<Conversation>` element.
 */
export const Conversation = React.forwardRef<HTMLDivElement, ConversationProps>(
  ({ className, children, viewportRef, ...props }, ref) => {
    const internalRef = React.useRef<HTMLDivElement | null>(null);
    const [atBottom, setAtBottom] = React.useState(true);

    const setViewportRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        internalRef.current = node;
        if (viewportRef) {
          viewportRef.current = node;
        }
      },
      [viewportRef]
    );

    React.useEffect(() => {
      const el = internalRef.current;
      if (!el) return;
      const onScroll = () => {
        const threshold = 80;
        const remaining =
          el.scrollHeight - el.scrollTop - el.clientHeight;
        setAtBottom(remaining < threshold);
      };
      el.addEventListener("scroll", onScroll, { passive: true });
      return () => el.removeEventListener("scroll", onScroll);
    }, []);

    React.useEffect(() => {
      const el = internalRef.current;
      if (!el) return;
      if (atBottom) {
        el.scrollTop = el.scrollHeight;
      }
    });

    return (
      <ScrollArea
        ref={ref}
        className={cn("relative flex-1 min-h-0", className)}
        {...props}
      >
        <div
          ref={setViewportRef}
          className="flex flex-col gap-6 p-6 mx-auto w-full max-w-4xl"
        >
          {children}
        </div>
      </ScrollArea>
    );
  }
);
Conversation.displayName = "Conversation";

/** Roles emitted by eve's `defaultMessageReducer`. */
export type Role = "user" | "assistant";
