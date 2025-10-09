import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface PixelBadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "inverted"
    | "outline"
    | "success"
    | "warning"
    | "error";
}

export function PixelBadge({
  children,
  className,
  variant = "default",
  ...props
}: PixelBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center",
        "font-mono text-xs font-bold uppercase tracking-wider",
        "px-3 py-1",
        "relative",
        // Default variant
        variant === "default" && [
          "bg-primary text-primary-foreground",
          "shadow-[0_0_0_2px_var(--color-border)]",
        ],
        // Inverted variant
        variant === "inverted" && [
          "bg-card text-card-foreground",
          "shadow-[0_0_0_2px_var(--color-border)]",
        ],
        // Outline variant
        variant === "outline" && [
          "bg-transparent text-foreground",
          "shadow-[inset_0_0_0_2px_var(--color-border)]",
        ],
        // Success variant
        variant === "success" && [
          "bg-primary text-primary-foreground",
          "shadow-[0_0_0_2px_var(--color-border)]",
          "after:absolute after:top-0 after:right-0 after:h-1 after:w-1 after:bg-border",
        ],
        // Warning variant
        variant === "warning" && [
          "bg-secondary text-secondary-foreground",
          "shadow-[0_0_0_2px_var(--color-border)]",
        ],
        // Error variant
        variant === "error" && [
          "bg-destructive text-destructive-foreground",
          "shadow-[0_0_0_2px_var(--color-border)]",
        ],
        className
      )}
      {...props}
    >
      {/* Corner pixels for extra retro feel */}
      <span className="absolute left-0 top-0 h-[2px] w-[2px] bg-border" />
      <span className="absolute right-0 top-0 h-[2px] w-[2px] bg-border" />
      <span className="absolute bottom-0 left-0 h-[2px] w-[2px] bg-border" />
      <span className="absolute bottom-0 right-0 h-[2px] w-[2px] bg-border" />

      <span className="relative z-10">{children}</span>
    </div>
  );
}
