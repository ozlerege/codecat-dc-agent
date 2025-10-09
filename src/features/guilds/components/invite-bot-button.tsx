"use client";

import { PixelButton } from "@/components/pixel-button";
import { env, hasDiscordAppId } from "@/lib/config/env";
import { getDiscordBotInviteUrl } from "@/lib/config/constants";
import { cn } from "@/lib/utils";

type InviteBotButtonProps = {
  className?: string;
  label?: string;
  guildId?: string;
  hideLabel?: boolean;
};

export const InviteBotButton = ({
  className,
  label = "Invite Bot",
  guildId,
  hideLabel = false,
}: InviteBotButtonProps) => {
  const hasAppId = hasDiscordAppId();

  const inviteUrl = hasAppId
    ? getDiscordBotInviteUrl(env.NEXT_PUBLIC_DISCORD_APP_ID, guildId)
    : undefined;

  const content = (
    <>
      {hideLabel ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span>{label}</span>
      )}
    </>
  );

  if (!hasAppId || !inviteUrl) {
    return (
      <PixelButton
        type="button"
        variant="discord"
        className={cn("justify-center", className)}
        disabled
        aria-disabled="true"
        title="Discord app ID is not configured."
      >
        {content}
      </PixelButton>
    );
  }

  return (
    <PixelButton variant="discord" className={cn("justify-center", className)}>
      <a href={inviteUrl} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    </PixelButton>
  );
};
