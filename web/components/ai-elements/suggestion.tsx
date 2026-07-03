"use client";

import { Button } from "@/components/ui/button";
import {
  ScrollArea,
  ScrollBar,
} from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useCallback } from "react";

export type SuggestionsProps = ComponentProps<"div"> & {
  layout?: "scroll" | "grid";
};

export const Suggestions = ({
  className,
  children,
  layout = "scroll",
  ...props
}: SuggestionsProps) => {
  if (layout === "grid") {
    return (
      <div
        className={cn("grid grid-cols-1 gap-2 sm:grid-cols-2", className)}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <ScrollArea className="w-full overflow-x-auto whitespace-nowrap" {...props}>
      <div className={cn("flex w-max flex-nowrap items-center gap-2", className)}>
        {children}
      </div>
      <ScrollBar className="hidden" orientation="horizontal" />
    </ScrollArea>
  );
};

export type SuggestionProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  suggestion: string;
  onClick?: (suggestion: string) => void;
  label?: string;
  icon?: LucideIcon;
  layout?: "chip" | "card";
};

export const Suggestion = ({
  suggestion,
  onClick,
  className,
  variant = "outline",
  size = "sm",
  children,
  label,
  icon: Icon,
  layout = "chip",
  ...props
}: SuggestionProps) => {
  const handleClick = useCallback(() => {
    onClick?.(suggestion);
  }, [onClick, suggestion]);

  const text = children || suggestion;

  if (layout === "card") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "group flex w-full flex-col gap-1.5 rounded-lg bg-card p-3 text-left shadow-border transition-colors",
          "hover:bg-accent focus-visible:outline-none focus-visible:shadow-[var(--ds-focus-ring)]",
          "disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...(props as ComponentProps<"button">)}
      >
        {label && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
            {Icon ? <Icon className="size-3.5 shrink-0" /> : null}
            <span>{label}</span>
          </span>
        )}
        <span className="text-sm leading-snug text-foreground">{text}</span>
      </button>
    );
  }

  return (
    <Button
      className={cn(
        "h-auto min-h-7 cursor-pointer rounded-md px-3 py-1.5 whitespace-normal shadow-border",
        className
      )}
      onClick={handleClick}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      {text}
    </Button>
  );
};
