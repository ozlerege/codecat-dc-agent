import type { SupabaseClient, Session } from "@supabase/supabase-js";

export type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner?: boolean;
  permissions?: string | null;
};

export const ADMIN_PERMISSION_BIT = BigInt(1) << BigInt(3);
const DEFAULT_DISCORD_AVATAR = "https://cdn.discordapp.com/embed/avatars/0.png";

type TypedSupabaseClient = SupabaseClient;

export const getGuildIconUrl = (
  guildId: string,
  icon: string | null | undefined
) => {
  if (icon) {
    return `https://cdn.discordapp.com/icons/${guildId}/${icon}.png?size=128`;
  }

  return DEFAULT_DISCORD_AVATAR;
};

export const buildGuildIconUrl = (guild: DiscordGuild) => {
  return getGuildIconUrl(guild.id, guild.icon);
};

export const userIsAdminInGuild = (guild: DiscordGuild) => {
  if (guild.owner) {
    return true;
  }

  if (!guild.permissions) {
    return false;
  }

  try {
    const permissionBits = BigInt(guild.permissions);
    return (permissionBits & ADMIN_PERMISSION_BIT) === ADMIN_PERMISSION_BIT;
  } catch (error) {
    console.error("Failed to parse guild permissions:", error);
    return false;
  }
};

const getDiscordIdentity = (session: Session | null | undefined) => {
  return (
    session?.user?.identities?.find(
      (identity) => identity.provider === "discord"
    ) ?? null
  );
};

export const extractDiscordAccessToken = (
  session: Session | null | undefined
): string | null => {
  if (!session) {
    console.log("No session available");
    return null;
  }

  // First try the provider_token directly
  if (session.provider_token) {
    console.log("Found provider_token");
    return session.provider_token;
  }

  // Try to get from identity data
  const identity = getDiscordIdentity(session);
  if (!identity) {
    console.log("No Discord identity found");
    return null;
  }

  const identityData = (identity?.identity_data ?? {}) as Record<
    string,
    unknown
  >;

  console.log("Identity data keys:", Object.keys(identityData));

  const potentialKeys = [
    "access_token",
    "token",
    "oauth_token",
    "provider_access_token",
  ];

  for (const key of potentialKeys) {
    const value = identityData?.[key];
    if (typeof value === "string" && value.length > 0) {
      console.log(`Found access token in ${key}`);
      return value;
    }
  }

  console.log("No access token found in identity data");
  return null;
};

type DiscordGuildResponse = {
  unauthorized: boolean;
  guilds: DiscordGuild[];
};

const requestDiscordGuilds = async (
  accessToken: string
): Promise<DiscordGuildResponse> => {
  try {
    console.log(
      "Requesting Discord guilds with token:",
      accessToken.substring(0, 10) + "..."
    );

    const response = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    console.log("Discord API response status:", response.status);

    if (response.status === 401) {
      console.log("Discord API returned 401 - unauthorized");
      return { unauthorized: true, guilds: [] };
    }

    if (!response.ok) {
      const body = await response.text();
      console.error("Failed to fetch Discord guilds:", response.status, body);
      return { unauthorized: false, guilds: [] };
    }

    const guilds = (await response.json()) as DiscordGuild[];
    console.log("Successfully fetched guilds:", guilds.length);
    return { unauthorized: false, guilds };
  } catch (error) {
    console.error("Error fetching Discord guilds:", error);
    return { unauthorized: false, guilds: [] };
  }
};

type FetchAdminGuildsReturn = {
  session: Session;
  guilds: DiscordGuild[];
};

export const fetchAdminGuilds = async (
  supabase: TypedSupabaseClient,
  initialSession: Session
): Promise<FetchAdminGuildsReturn> => {
  let session = initialSession;
  let accessToken = extractDiscordAccessToken(session);

  const ensureAccessToken = async () => {
    if (accessToken) {
      return;
    }

    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error(
        "Error refreshing Supabase session for Discord access:",
        error
      );
      return;
    }

    if (data.session) {
      session = data.session;
      accessToken = extractDiscordAccessToken(session);
    }
  };

  await ensureAccessToken();

  if (!accessToken) {
    console.warn("No Discord access token available for current session.");
    return { session, guilds: [] };
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await requestDiscordGuilds(accessToken);

    if (!result.unauthorized) {
      return {
        session,
        guilds: result.guilds.filter(userIsAdminInGuild),
      };
    }

    accessToken = null;
    await ensureAccessToken();

    if (!accessToken) {
      break;
    }
  }

  return { session, guilds: [] };
};
