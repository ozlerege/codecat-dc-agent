import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "inverted" | "ghost" | "discord";
}

export function PixelButton({
  children,
  className,
  variant = "default",
  ...props
}: PixelButtonProps) {
  return (
    <button
      className={cn(
        "relative font-mono text-sm font-bold uppercase tracking-wider cursor-pointer",
        "px-6 py-3",
        "transition-all duration-75",
        // Default variant
        variant === "default" && [
          "bg-primary text-primary-foreground",
          "shadow-[0_0_0_3px_var(--color-border)]",
          "hover:shadow-[0_0_0_3px_var(--color-border),4px_4px_0_var(--color-border)]",
          "hover:translate-x-[-2px] hover:translate-y-[-2px]",
          "active:translate-x-[2px] active:translate-y-[2px]",
          "active:shadow-[0_0_0_3px_var(--color-border)]",
        ],
        // Inverted variant
        variant === "inverted" && [
          "bg-card text-card-foreground",
          "shadow-[0_0_0_3px_var(--color-border)]",
          "hover:shadow-[0_0_0_3px_var(--color-border),4px_4px_0_var(--color-border)]",
          "hover:translate-x-[-2px] hover:translate-y-[-2px]",
          "active:translate-x-[2px] active:translate-y-[2px]",
          "active:shadow-[0_0_0_3px_var(--color-border)]",
        ],
        // Ghost variant
        variant === "ghost" && [
          "bg-transparent text-foreground",
          "shadow-[inset_0_0_0_3px_var(--color-border)]",
          "hover:bg-secondary",
        ],
        variant === "discord" && [
          "bg-[#5764f0] text-white",
          "shadow-[0_0_0_3px_var(--color-border)]",
          "hover:shadow-[0_0_0_3px_var(--color-border),4px_4px_0_var(--color-border)]",
          "hover:translate-x-[-2px] hover:translate-y-[-2px]",
          "active:translate-x-[2px] active:translate-y-[2px]",
          "active:shadow-[0_0_0_3px_var(--color-border)]",
        ],
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "disabled:hover:translate-x-0 disabled:hover:translate-y-0",
        "disabled:hover:shadow-[0_0_0_3px_var(--color-border)]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
