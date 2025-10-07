export const GUILD_ID_REGEX = /^\d{17,20}$/;

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

