import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 font-sans",
  {
    variants: {
      variant: {
        /** Primary: Graphite (#0a0a0a) background, Chalk (#fff) text. No shadow. */
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]",
        /** Secondary: Mist (#f2f2f2) background, Graphite text */
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        /** Outline: Hairline (#e5e5e5) border, transparent bg */
        outline:
          "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground",
        /** Ghost: No background, no border, Mist on hover */
        ghost: "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
