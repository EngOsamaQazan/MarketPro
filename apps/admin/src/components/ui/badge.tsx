import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-amber-300/15 text-amber-300",
        secondary: "bg-surface-elevated text-text-secondary",
        success: "bg-success-400/15 text-success-400",
        warning: "bg-warning-400/15 text-warning-400",
        destructive: "bg-error-400/15 text-error-400",
        info: "bg-accent-400/15 text-accent-400",
        purple: "bg-purple-500/15 text-purple-400",
        outline: "border border-border-default text-text-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
