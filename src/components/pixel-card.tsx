import type React from "react";
import { cn } from "@/lib/utils";

interface PixelCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "inverted" | "window";
  title?: string;
}

export function PixelCard({
  children,
  className,
  variant = "default",
  title,
}: PixelCardProps) {
  return (
    <div
      className={cn(
        "relative font-mono",
        "bg-card text-card-foreground",
        // Pixel border effect using box-shadow
        "shadow-[0_0_0_4px_var(--color-border)]",
        // Inner shadow for depth
        "before:absolute before:inset-0 before:shadow-[inset_4px_4px_0_rgba(0,0,0,0.1)]",
        "before:pointer-events-none",
        variant === "inverted" && "bg-primary text-primary-foreground",
        variant === "window" &&
          "shadow-[0_0_0_4px_var(--color-border),0_0_0_8px_var(--color-card)]",
        className
      )}
    >
      {/* Window title bar for window variant */}
      {variant === "window" && title && (
        <div className="flex items-center justify-between border-b-4 border-border bg-secondary px-4 py-2">
          <span className="text-sm font-bold uppercase tracking-wider">
            {title}
          </span>
          <div className="flex gap-2">
            <div className="h-3 w-3 border-2 border-border bg-card" />
            <div className="h-3 w-3 border-2 border-border bg-card" />
            <div className="h-3 w-3 border-2 border-border bg-card" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-6">{children}</div>

      {/* Corner pixels for extra retro feel */}
      <div className="pointer-events-none absolute left-0 top-0 h-2 w-2 bg-border" />
      <div className="pointer-events-none absolute right-0 top-0 h-2 w-2 bg-border" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-2 w-2 bg-border" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-2 w-2 bg-border" />
    </div>
  );
}

export function PixelCardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mb-4 space-y-1", className)}>{children}</div>;
}

export function PixelCardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "font-mono text-2xl font-bold uppercase tracking-wider leading-tight",
        "text-balance",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function PixelCardDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-mono text-sm text-muted-foreground leading-relaxed",
        className
      )}
    >
      {children}
    </p>
  );
}

export function PixelCardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("font-mono", className)}>{children}</div>;
}

export function PixelCardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mt-4 flex items-center gap-4", className)}>
      {children}
    </div>
  );
}
