"use client";

import * as React from "react";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface PromptInputProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
  className?: string;
  /** Optional hidden file input — wired through to caller via `onFiles`. */
  onFiles?: (files: File[]) => void;
}

/**
 * AI-SDK-Elements style prompt input. Auto-resizes up to a cap, submits on
 * Enter (Shift+Enter = newline), and exposes a square button while streaming
 * to call `onStop`.
 */
export function PromptInput({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled,
  isStreaming,
  placeholder = "Send a message…",
  className,
  onFiles,
}: PromptInputProps) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const adjustHeight = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0";
    const next = Math.min(el.scrollHeight, 240);
    el.style.height = `${next}px`;
  }, []);

  React.useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && value.trim()) onSubmit();
      }}
      className={cn(
        "flex w-full items-end gap-2 rounded-[10px] border border-border bg-card px-3 py-2 transition-all focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground",
        className
      )}
    >
      {onFiles && (
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) onFiles(files);
            e.target.value = "";
          }}
        />
      )}
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        className={cn(
          "min-h-[36px] max-h-[240px] flex-1 resize-none bg-transparent text-sm leading-relaxed",
          "placeholder:text-muted-foreground outline-none disabled:opacity-50 scrollable"
        )}
      />
      {isStreaming && onStop ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onStop}
          aria-label="Stop generating"
        >
          <Square className="size-4" />
        </Button>
      ) : (
        <Button
          type="submit"
          size="icon"
          disabled={disabled || !value.trim()}
          aria-label="Send message"
        >
          <ArrowUp className="size-4" />
        </Button>
      )}
    </form>
  );
}
