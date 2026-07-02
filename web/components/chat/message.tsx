"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "./conversation";

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  role: Role;
  fromName?: string;
  children?: React.ReactNode;
}

const ROLE_META: Record<
  Role,
  { name: string; avatarBg: string; avatarFg: string; icon: React.ReactNode }
> = {
  user: {
    name: "You",
    avatarBg: "bg-foreground",              // graphite avatar on a chalk surface
    avatarFg: "text-background",
    icon: <User className="size-4" />,
  },
  assistant: {
    name: "Resights AI",
    avatarBg: "bg-muted",                   // mist with a hairline border
    avatarFg: "text-foreground",
    icon: <Sparkles className="size-4" />,
  },
};

/**
 * Renders a single message bubble matching Vercel's `<Message>` shape:
 * avatar on the side, name + content, separated by role.
 */
export const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ role, fromName, className, children, ...props }, ref) => {
    const meta = ROLE_META[role] ?? ROLE_META.assistant;
    const isUser = role === "user";
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn(
          "flex gap-3",
          isUser ? "flex-row-reverse" : "flex-row",
          className
        )}
        {...(props as React.ComponentProps<typeof motion.div>)}
      >
        <div
          className={cn(
            "flex size-8 shrink-0 select-none items-center justify-center rounded-[10px] border border-border",
            meta.avatarBg,
            meta.avatarFg
          )}
          aria-hidden
        >
          {meta.icon}
        </div>
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col gap-1.5",
            isUser ? "items-end" : "items-start"
          )}
        >
          <div
            className={cn(
              "text-xs font-medium text-muted-foreground",
              isUser && "text-right"
            )}
          >
            {fromName ?? meta.name}
          </div>
          <div
            className={cn(
              "rounded-[14px] px-4 py-3 text-sm",
              isUser
                ? "max-w-[85%] bg-foreground text-background rounded-tr-[4px]"
                : "w-full max-w-full bg-card border border-border rounded-tl-[4px]"
            )}
          >
            {children}
          </div>
        </div>
      </motion.div>
    );
  }
);
Message.displayName = "Message";
