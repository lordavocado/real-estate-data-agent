"use client";

import * as React from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConversationScrollButtonProps {
  containerRef: React.RefObject<HTMLElement | null>;
  className?: string;
}

/**
 * Floating scroll-to-bottom control — AI Elements pattern for long threads.
 */
export function ConversationScrollButton({
  containerRef,
  className,
}: ConversationScrollButtonProps) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 96;
    const onScroll = () => {
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      setVisible(remaining > threshold);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [containerRef]);

  if (!visible) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(
        "absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-card shadow-none",
        className
      )}
      aria-label="Scroll to latest message"
      onClick={() => {
        const el = containerRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }}
    >
      <ArrowDown className="size-4" />
    </Button>
  );
}
