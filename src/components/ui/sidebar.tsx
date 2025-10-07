"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

type SidebarContextValue = {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined);

type SidebarProviderProps = {
  children: React.ReactNode;
};

export const SidebarProvider = ({ children }: SidebarProviderProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggle = React.useCallback(() => {
    setIsOpen((current) => !current);
  }, []);

  const close = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close }}>
      <div className="flex min-h-screen w-full">{children}</div>
    </SidebarContext.Provider>
  );
};

const useSidebar = () => {
  const context = React.useContext(SidebarContext);

  if (!context) {
    throw new Error("Sidebar components must be used within <SidebarProvider>");
  }

  return context;
};

export const SidebarTrigger = ({ className }: { className?: string }) => {
  const { toggle } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("lg:hidden", className)}
      onClick={toggle}
      aria-label="Toggle navigation"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
};

type SidebarProps = React.HTMLAttributes<HTMLDivElement>;

export const Sidebar = ({ className, ...props }: SidebarProps) => {
  const { isOpen, close } = useSidebar();

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 -translate-x-full border-r bg-background transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:static lg:translate-x-0",
          isOpen && "translate-x-0",
          className
        )}
        {...props}
      />
      {isOpen ? (
        <div
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm lg:hidden"
          role="presentation"
          onClick={close}
        />
      ) : null}
    </>
  );
};

export const SidebarHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex h-16 items-center gap-2 border-b px-4", className)} {...props} />
);

export const SidebarContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex-1 overflow-y-auto px-3 py-4", className)} {...props} />
);

export const SidebarFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("border-t px-3 py-4", className)} {...props} />
);

export const SidebarSection = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-1", className)} {...props} />
);

export const SidebarSectionLabel = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("px-2 text-xs font-semibold uppercase text-muted-foreground", className)} {...props} />
);

export const SidebarMenu = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) => (
  <ul className={cn("space-y-1", className)} {...props} />
);

export const SidebarMenuItem = ({
  className,
  ...props
}: React.LiHTMLAttributes<HTMLLIElement>) => (
  <li className={cn("list-none", className)} {...props} />
);

type SidebarMenuButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive?: boolean;
  icon?: React.ReactNode;
};

export const SidebarMenuButton = ({
  className,
  isActive = false,
  icon,
  children,
  ...props
}: SidebarMenuButtonProps) => (
  <button
    className={cn(
      "group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      isActive ? "bg-muted text-foreground" : "text-muted-foreground",
      className
    )}
    {...props}
  >
    {icon ? <span className="flex h-4 w-4 items-center justify-center">{icon}</span> : null}
    <span>{children}</span>
  </button>
);

export { useSidebar };
