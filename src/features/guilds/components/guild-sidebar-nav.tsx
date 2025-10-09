"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  Settings,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSection,
  SidebarSectionLabel,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SignOutButton } from "@/components/sign-out-button";
import { getGuildIconUrl } from "@/lib/discord/guilds";
import { useGuildDetailQuery } from "@/lib/guilds/hooks";
import { useGuildRouteContext } from "../context";
import { cn } from "@/lib/utils";

type NavItem = {
  readonly id: string;
  readonly label: string;
  readonly href: (guildId: string) => string;
  readonly icon: LucideIcon;
};

const navItems: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: (guildId: string) => `/guilds/${guildId}`,
    icon: LayoutDashboard,
  },
  {
    id: "settings",
    label: "Settings",
    href: (guildId: string) => `/guilds/${guildId}/settings`,
    icon: Settings,
  },
  {
    id: "tasks",
    label: "Tasks",
    href: (guildId: string) => `/guilds/${guildId}/tasks`,
    icon: ListChecks,
  },
];

export const GuildSidebarLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <SidebarProvider>
    <GuildSidebar />
    <GuildContent>{children}</GuildContent>
  </SidebarProvider>
);

const GuildSidebar = () => {
  const pathname = usePathname();
  const { guildId, guildName, guildIcon, initialDetail } =
    useGuildRouteContext();
  const detailQuery = useGuildDetailQuery(guildId, {
    initialData: initialDetail,
    includeTasks: false,
  });
  const { close, isMobile, collapsed } = useSidebar();

  const sidebarGuild = detailQuery.data?.guild ?? initialDetail.guild;
  const avatarUrl = getGuildIconUrl(guildId, guildIcon ?? sidebarGuild.icon);
  const displayName = sidebarGuild.name;

  const handleNavigate = React.useCallback(() => {
    if (isMobile) {
      close();
    }
  }, [close, isMobile]);

  return (
    <Sidebar>
      <SidebarHeader>
        <div
          className={cn(
            "flex w-full items-center gap-3 overflow-hidden",
            collapsed && "justify-center"
          )}
        >
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-border shadow-[0_0_0_2px_var(--color-border)]",
              collapsed && "mx-auto"
            )}
          >
            <img
              src={avatarUrl}
              alt={`${guildName} icon`}
              className="h-full w-full object-cover"
            />
          </div>
          {collapsed ? (
            <span className="sr-only">{displayName} guild</span>
          ) : (
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span className="truncate text-sm font-bold uppercase tracking-wide leading-tight">
                {displayName}
              </span>
              <span className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Guild
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col gap-6">
        <SidebarSection>
          <SidebarSectionLabel>Management</SidebarSectionLabel>
          <TooltipProvider delayDuration={0}>
            <SidebarMenu>
              {navItems.map((item) => {
                const href = item.href(guildId);
                const isActive = pathname === href;
                const Icon = item.icon;

                const menuButton = (
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link
                      href={href}
                      onClick={handleNavigate}
                      aria-current={isActive ? "page" : undefined}
                      aria-label={item.label}
                      className={cn(
                        "flex w-full items-center gap-3 overflow-hidden",
                        collapsed && "justify-center gap-0"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {collapsed ? (
                        <span className="sr-only">{item.label}</span>
                      ) : (
                        <span className="truncate leading-tight">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                );

                return (
                  <SidebarMenuItem key={item.id}>
                    {collapsed ? (
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      menuButton
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </TooltipProvider>
        </SidebarSection>
      </SidebarContent>
    </Sidebar>
  );
};

const GuildContent = ({ children }: { children: React.ReactNode }) => {
  const { guildId, guildName, initialDetail } = useGuildRouteContext();
  const detailQuery = useGuildDetailQuery(guildId, {
    initialData: initialDetail,
    includeTasks: false,
  });
  const currentName = detailQuery.data?.guild.name ?? guildName;

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b-4 border-border px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-1" />

          <p className="text-xl font-bold uppercase tracking-wide leading-none truncate">
            {currentName}
          </p>
        </div>
        <SignOutButton />
      </header>
      <main className="flex-1 overflow-y-auto px-6 py-8">{children}</main>
    </SidebarInset>
  );
};
