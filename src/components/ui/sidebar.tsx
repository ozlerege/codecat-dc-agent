"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SidebarContextValue = {
  open: boolean;
  collapsed: boolean;
  isMobile: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleOpen: () => void;
  toggleCollapsed: () => void;
  close: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

type SidebarProviderProps = {
  readonly children: React.ReactNode;
  readonly defaultOpen?: boolean;
};

export const SidebarProvider = ({
  children,
  defaultOpen = false,
}: SidebarProviderProps) => {
  const getMediaQuery = React.useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return window.matchMedia("(min-width: 1024px)");
  }, []);

  const [isMobile, setIsMobile] = React.useState(() => {
    const mediaQuery = getMediaQuery();
    return mediaQuery ? !mediaQuery.matches : false;
  });

  const [open, setOpen] = React.useState(() => {
    const mediaQuery = getMediaQuery();
    if (!mediaQuery) {
      return defaultOpen;
    }
    return mediaQuery.matches ? true : defaultOpen;
  });

  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = getMediaQuery();
    if (!mediaQuery) {
      return;
    }

    const syncMatches = (matches: boolean) => {
      setIsMobile(!matches);
      setCollapsed(false);
      if (matches) {
        setOpen(true);
      } else {
        setOpen(defaultOpen);
      }
    };

    syncMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      syncMatches(event.matches);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [getMediaQuery, defaultOpen]);

  const toggleOpen = React.useCallback(() => {
    setOpen((previous) => !previous);
  }, []);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((previous) => !previous);
  }, []);

  const close = React.useCallback(() => {
    setOpen(false);
    setCollapsed(false);
  }, []);

  const value = React.useMemo(
    () => ({
      open,
      collapsed,
      isMobile,
      setOpen,
      setCollapsed,
      toggleOpen,
      toggleCollapsed,
      close,
    }),
    [open, collapsed, isMobile, toggleOpen, toggleCollapsed, close]
  );

  return (
    <SidebarContext.Provider value={value}>
      <div
        data-state={open ? "open" : "closed"}
        className="flex h-screen w-full min-h-0 min-w-0 overflow-hidden bg-background text-foreground font-mono lg:[height:100dvh]"
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("Sidebar components must be used within <SidebarProvider>");
  }
  return context;
};

type SidebarTriggerProps = React.ComponentProps<typeof Button>;

export const SidebarTrigger = ({
  className,
  onClick,
  ...props
}: SidebarTriggerProps) => {
  const { open, collapsed, isMobile, toggleOpen, toggleCollapsed } =
    useSidebar();

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        onClick(event);
      }
      if (!event.defaultPrevented) {
        if (isMobile) {
          toggleOpen();
        } else {
          toggleCollapsed();
        }
      }
    },
    [onClick, isMobile, toggleOpen, toggleCollapsed]
  );

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      data-collapsed={collapsed ? "true" : "false"}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-none border-2 border-border bg-card text-card-foreground font-mono uppercase tracking-wide shadow-[0_0_0_2px_var(--color-border)] transition-all",
        "before:pointer-events-none before:absolute before:inset-0 before:shadow-[inset_2px_2px_0_rgba(0,0,0,0.15)]",
        "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      aria-expanded={isMobile ? open : !collapsed}
      aria-pressed={isMobile ? undefined : collapsed}
      onClick={handleClick}
      {...props}
    >
      <Menu className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
};

type SidebarElement = React.ElementRef<"aside">;
type SidebarProps = React.ComponentPropsWithoutRef<"aside">;

export const Sidebar = React.forwardRef<SidebarElement, SidebarProps>(
  ({ className, children, ...props }, ref) => {
    const { open, collapsed, close, isMobile } = useSidebar();

    return (
      <>
        <aside
          ref={ref}
          data-state={open ? "open" : "closed"}
          data-collapsed={collapsed ? "true" : "false"}
          className={cn(
            "group/sidebar relative fixed inset-y-0 left-0 z-50 flex h-full w-64 min-w-[16rem] -translate-x-full flex-col overflow-hidden border-r-4 border-border bg-card text-card-foreground font-mono lg:h-full lg:flex-shrink-0",
            "shadow-[0_0_0_4px_var(--color-border)] before:pointer-events-none before:absolute before:inset-0 before:shadow-[inset_4px_4px_0_rgba(0,0,0,0.12)]",
            "transition-all duration-300 ease-in-out data-[state=open]:translate-x-0 lg:static lg:z-0 lg:translate-x-0",
            "data-[collapsed=true]:w-[5.25rem] data-[collapsed=true]:min-w-[5.25rem] data-[collapsed=true]:max-w-[5.25rem]",
            className
          )}
          {...props}
        >
          <div className="flex h-full flex-col">{children}</div>
        </aside>
        {isMobile && open ? (
          <div
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm transition-opacity duration-200 lg:hidden"
            role="presentation"
            onClick={close}
          />
        ) : null}
      </>
    );
  }
);

Sidebar.displayName = "Sidebar";

type SidebarInsetProps = React.HTMLAttributes<HTMLDivElement>;

export const SidebarInset = ({ className, ...props }: SidebarInsetProps) => (
  <div
    className={cn(
      "flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden bg-muted/30 font-mono lg:bg-background",
      className
    )}
    {...props}
  />
);

export const SidebarHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { collapsed } = useSidebar();

  return (
    <div
      className={cn(
        "flex h-16 shrink-0 items-center gap-3 border-b-4 border-border px-4 font-mono transition-all duration-300",
        collapsed && "px-2",
        className
      )}
      {...props}
    />
  );
};

export const SidebarContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { collapsed } = useSidebar();

  return (
    <div
      className={cn(
        "flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4 font-mono transition-all duration-300",
        collapsed && "px-2",
        className
      )}
      {...props}
    />
  );
};

export const SidebarFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { collapsed } = useSidebar();

  return (
    <div
      className={cn(
        "shrink-0 border-t-4 border-border px-4 py-4 font-mono",
        collapsed && "px-2",
        className
      )}
      {...props}
    />
  );
};

export const SidebarSection = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { collapsed } = useSidebar();

  return (
    <div
      className={cn(
        "space-y-3 font-mono",
        collapsed && "space-y-4 text-center",
        className
      )}
      {...props}
    />
  );
};

export const SidebarSectionLabel = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => {
  const { collapsed } = useSidebar();

  if (collapsed) {
    return null;
  }

  return (
    <p
      className={cn(
        "px-2 text-xs font-bold uppercase tracking-widest text-muted-foreground font-mono",
        className
      )}
      {...props}
    />
  );
};

export const SidebarMenu = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) => (
  <ul className={cn("space-y-2", className)} {...props} />
);

export const SidebarMenuItem = ({
  className,
  ...props
}: React.LiHTMLAttributes<HTMLLIElement>) => (
  <li className={cn("list-none font-mono", className)} {...props} />
);

type SidebarMenuButtonProps = {
  readonly asChild?: boolean;
  readonly isActive?: boolean;
} & React.ComponentPropsWithoutRef<"button">;

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonProps
>(({ className, asChild = false, isActive = false, type, ...props }, ref) => {
  const { collapsed } = useSidebar();

  const sharedClassName = cn(
    "group flex w-full items-center gap-3 rounded-none px-3 py-3 text-sm font-bold uppercase tracking-wider font-mono transition-all",
    "text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-[inset_2px_2px_0_rgba(0,0,0,0.12)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    isActive
      ? "bg-muted text-foreground shadow-[0_0_0_2px_var(--color-border)]"
      : "shadow-[0_0_0_2px_transparent]",
    collapsed && "justify-center px-2 gap-0",
    className
  );

  if (asChild) {
    return (
      <Slot
        data-state={isActive ? "active" : "inactive"}
        data-collapsed={collapsed ? "true" : "false"}
        className={sharedClassName}
        {...props}
      />
    );
  }

  return (
    <button
      ref={ref}
      type={type ?? "button"}
      data-state={isActive ? "active" : "inactive"}
      data-collapsed={collapsed ? "true" : "false"}
      className={sharedClassName}
      {...props}
    />
  );
});

SidebarMenuButton.displayName = "SidebarMenuButton";

export { useSidebar };
