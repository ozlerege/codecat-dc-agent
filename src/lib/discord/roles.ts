export type DiscordRole = {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
  mentionable: boolean;
};

export const fetchDiscordRoles = async (guildId: string) => {
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!botToken) {
    throw new Error(
      "Discord bot token is not configured. Please set DISCORD_BOT_TOKEN environment variable."
    );
  }

  // Validate token format (Discord bot tokens typically start with specific patterns)
  if (!botToken.match(/^[A-Za-z0-9._-]+$/)) {
    throw new Error("Discord bot token format appears to be invalid.");
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/roles`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );
    console.log("Roles response:", response);
    if (!response.ok) {
      const body = await response.text();

      let errorMessage = `Failed to fetch Discord roles: ${response.status}`;

      // Provide more specific error messages based on status codes
      switch (response.status) {
        case 401:
          errorMessage = "Discord bot token is invalid or expired";
          break;
        case 403:
          errorMessage =
            "Bot does not have permission to view roles in this guild";
          break;
        case 404:
          errorMessage = "Guild not found or bot is not a member of this guild";
          break;
        case 429:
          errorMessage = "Rate limited by Discord API. Please try again later";
          break;
        default:
          errorMessage = `Discord API error (${response.status}): ${body}`;
      }

      throw new Error(errorMessage);
    }

    const roles = (await response.json()) as DiscordRole[];
    return roles;
  } catch (error) {
    // Re-throw with more context if it's a network error
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to Discord API");
    }
    throw error;
  }
};
