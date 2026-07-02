import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "carbon";

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  default:
    "border-transparent bg-primary text-primary-foreground",
  secondary:
    "border-transparent bg-secondary text-secondary-foreground",
  outline:
    "text-foreground border-border",
  carbon:
    "border-transparent bg-[#171717] text-white",
};

const VARIANT_BASE =
  "inline-flex items-center gap-1 rounded-[26px] border px-2.5 py-0.5 text-xs font-medium transition-colors";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(VARIANT_BASE, VARIANT_CLASS[variant], className)}
      {...props}
    />
  );
}
