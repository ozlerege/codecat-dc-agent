import * as React from "react";
import { cn } from "@/lib/utils";

export interface PixelInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "inverted" | "outline";
}

const PixelInput = React.forwardRef<HTMLInputElement, PixelInputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    return (
      <div className="relative inline-block w-full">
        {/* Corner pixels */}
        <span className="absolute left-0 top-0 h-[3px] w-[3px] bg-border z-10 pointer-events-none" />
        <span className="absolute right-0 top-0 h-[3px] w-[3px] bg-border z-10 pointer-events-none" />
        <span className="absolute bottom-0 left-0 h-[3px] w-[3px] bg-border z-10 pointer-events-none" />
        <span className="absolute bottom-0 right-0 h-[3px] w-[3px] bg-border z-10 pointer-events-none" />

        <input
          type={type}
          className={cn(
            "w-full px-4 py-3",
            "font-mono text-sm font-bold uppercase tracking-wider",
            "transition-all duration-75",
            "outline-none",
            // Default variant
            variant === "default" && [
              "bg-card text-card-foreground",
              "shadow-[0_0_0_3px_var(--color-border)]",
              "focus:shadow-[0_0_0_3px_var(--color-border),2px_2px_0_var(--color-border)]",
              "focus:translate-x-[-1px] focus:translate-y-[-1px]",
            ],
            // Inverted variant
            variant === "inverted" && [
              "bg-primary text-primary-foreground",
              "shadow-[0_0_0_3px_var(--color-border)]",
              "focus:shadow-[0_0_0_3px_var(--color-border),2px_2px_0_var(--color-border)]",
              "focus:translate-x-[-1px] focus:translate-y-[-1px]",
            ],
            // Outline variant
            variant === "outline" && [
              "bg-transparent text-foreground",
              "shadow-[inset_0_0_0_3px_var(--color-border)]",
              "focus:shadow-[inset_0_0_0_3px_var(--color-border),inset_2px_2px_0_var(--color-border)]",
            ],
            "placeholder:text-muted-foreground placeholder:font-normal placeholder:lowercase",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "disabled:focus:translate-x-0 disabled:focus:translate-y-0",
            "disabled:focus:shadow-[0_0_0_3px_var(--color-border)]",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

PixelInput.displayName = "PixelInput";

export { PixelInput };
