"use client";

import { createContext, useContext } from "react";
import type { GuildDetailResult } from "@/lib/guilds/hooks";

type GuildRouteContextValue = {
  guildId: string;
  guildName: string;
  guildIcon: string | null;
  initialDetail: GuildDetailResult;
};

const GuildRouteContext = createContext<GuildRouteContextValue | undefined>(undefined);

export const GuildRouteProvider = ({
  value,
  children,
}: {
  value: GuildRouteContextValue;
  children: React.ReactNode;
}) => <GuildRouteContext.Provider value={value}>{children}</GuildRouteContext.Provider>;

export const useGuildRouteContext = () => {
  const context = useContext(GuildRouteContext);

  if (!context) {
    throw new Error("useGuildRouteContext must be used within GuildRouteProvider");
  }

  return context;
};

