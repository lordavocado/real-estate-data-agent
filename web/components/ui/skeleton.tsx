import { cn } from "@/lib/utils";

/** Soft shimmer skeleton used while AI is producing content. */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "shimmer rounded-[4px] bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  );
}
