"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

type InviteBotButtonProps = {
  className?: string;
  label?: string;
  guildId?: string;
};

const PERMISSIONS = 268435456; // Manage Roles permission

export const InviteBotButton = ({
  className,
  label = "Invite Bot",
  guildId,
}: InviteBotButtonProps) => {
  const clientId =
    process.env.NEXT_PUBLIC_DISCORD_APP_ID ||
    process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;

  if (!clientId) {
    return null;
  }

  const inviteUrl = new URL("https://discord.com/oauth2/authorize");
  inviteUrl.searchParams.set("client_id", clientId);
  inviteUrl.searchParams.set("scope", "bot applications.commands");
  inviteUrl.searchParams.set("permissions", String(PERMISSIONS));

  if (guildId) {
    inviteUrl.searchParams.set("guild_id", guildId);
    inviteUrl.searchParams.set("disable_guild_select", "true");
  }

  return (
    <Button asChild variant="secondary" className={className}>
      <a href={inviteUrl.toString()} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="mr-2 h-4 w-4" />
        {label}
      </a>
    </Button>
  );
};
