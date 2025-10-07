"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { env, hasDiscordAppId } from "@/lib/config/env";
import { getDiscordBotInviteUrl } from "@/lib/config/constants";

type InviteBotButtonProps = {
  className?: string;
  label?: string;
  guildId?: string;
};

export const InviteBotButton = ({
  className,
  label = "Invite Bot",
  guildId,
}: InviteBotButtonProps) => {
  if (!hasDiscordAppId()) {
    return null;
  }

  const inviteUrl = getDiscordBotInviteUrl(env.NEXT_PUBLIC_DISCORD_APP_ID, guildId);

  return (
    <Button asChild variant="secondary" className={className}>
      <a href={inviteUrl.toString()} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="mr-2 h-4 w-4" />
        {label}
      </a>
    </Button>
  );
};
