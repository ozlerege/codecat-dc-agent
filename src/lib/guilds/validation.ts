import { GUILD_CONFIG } from "@/lib/config/constants";

export const GUILD_ID_REGEX = GUILD_CONFIG.idPattern;

export const normalizeGuildId = (value: string | string[] | undefined): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!GUILD_ID_REGEX.test(trimmed)) {
    return null;
  }

  return trimmed;
};

