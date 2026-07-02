import { cn } from "@/lib/utils";

export interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Pixel or CSS length for the placeholder bar. Numeric values become px. */
  width?: number | string;
}

/**
 * Single shimmer bar — used for thinking skeleton blocks or inline placeholders
 * where a full Skeleton component would be too large. Pass a numeric width to
 * render at that many pixels, or a CSS length like `"60%"`.
 */
export function Shimmer({ width = "100%", className, ...props }: ShimmerProps) {
  const style = typeof width === "number" ? { width: `${width}px` } : { width };
  return (
    <span
      aria-hidden
      className={cn(
        "shimmer inline-block h-3 align-middle rounded-[4px]",
        className
      )}
      style={style}
      {...(props as React.HTMLAttributes<HTMLSpanElement>)}
    />
  );
}

/**
 * Drop-in "thinking text" placeholder while the agent is silent. Three
 * varying-width bars give a natural feel.
 */
export function ShimmerMessage({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-hidden>
      <Shimmer width="92%" />
      <Shimmer width="78%" />
      <Shimmer width="60%" />
    </div>
  );
}
