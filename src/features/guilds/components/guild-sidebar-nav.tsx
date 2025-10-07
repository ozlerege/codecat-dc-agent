"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, ListChecks } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSection,
  SidebarSectionLabel,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getGuildIconUrl } from "@/lib/discord/guilds";
import { Badge } from "@/components/ui/badge";
import { useGuildRouteContext } from "../context";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/sign-out-button";
import { useGuildDetailQuery } from "@/lib/guilds/hooks";

const navItems = [
  {
    id: "overview",
    label: "Overview",
    href: (guildId: string) => `/guilds/${guildId}`,
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    id: "settings",
    label: "Settings",
    href: (guildId: string) => `/guilds/${guildId}/settings`,
    icon: <Settings className="h-4 w-4" />,
  },
  {
    id: "tasks",
    label: "Tasks",
    href: (guildId: string) => `/guilds/${guildId}/tasks`,
    icon: <ListChecks className="h-4 w-4" />,
  },
];

export const GuildSidebarLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <SidebarNav />
      <GuildMainLayout>{children}</GuildMainLayout>
    </SidebarProvider>
  );
};

const SidebarNav = () => {
  const pathname = usePathname();
  const { guildId, guildName, guildIcon, initialDetail } = useGuildRouteContext();
  const detailQuery = useGuildDetailQuery(guildId, {
    initialData: initialDetail,
    includeTasks: false,
  });
  const { close } = useSidebar();
  const sidebarGuild = detailQuery.data?.guild ?? initialDetail.guild;
  const avatarUrl = getGuildIconUrl(guildId, guildIcon ?? sidebarGuild.icon);
  const displayName = sidebarGuild.name ?? guildName;

  return (
    <Sidebar className="bg-muted/40">
      <div className="flex h-full flex-col">
        <SidebarHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-full border">
              <img src={avatarUrl} alt={`${guildName} icon`} className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">{displayName}</span>
              <span className="text-xs text-muted-foreground">Guild ID: {guildId}</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarSection>
            <SidebarSectionLabel>Management</SidebarSectionLabel>
            <SidebarMenu>
              {navItems.map((item) => {
                const href = item.href(guildId);
                const isActive = pathname === href;

                return (
                  <SidebarMenuItem key={item.id}>
                    <Link
                      href={href}
                      className={cn(
                        "group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      onClick={close}
                    >
                      <span className="flex h-4 w-4 items-center justify-center">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarSection>
        </SidebarContent>
        <SidebarFooter>
          <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Create Roles</span>
              <Badge variant="outline">{sidebarGuild.permissions.create_roles.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Confirm Roles</span>
              <Badge variant="outline">{sidebarGuild.permissions.confirm_roles.length}</Badge>
            </div>
          </div>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
};

const GuildMainLayout = ({ children }: { children: React.ReactNode }) => {
  const { guildId, guildName, initialDetail } = useGuildRouteContext();
  const detailQuery = useGuildDetailQuery(guildId, {
    initialData: initialDetail,
    includeTasks: false,
  });
  const currentName = detailQuery.data?.guild.name ?? guildName;

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-semibold">{currentName}</h1>
            <p className="text-sm text-muted-foreground">
              Manage Jules automation settings and monitor activity.
            </p>
          </div>
        </div>
        <SignOutButton />
      </header>
      <main className="flex-1 overflow-y-auto px-6 py-8">{children}</main>
    </div>
  );
};
