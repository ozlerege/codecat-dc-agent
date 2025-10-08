import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GuildDetail } from "@/lib/guilds/service";
import type { DiscordRole } from "@/lib/discord/roles";
import { apiClient } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/types";

export type GuildSummary = {
  id: string;
  name: string;
  icon: string | null;
};

export type GuildsQueryResult = {
  userName: string;
  savedGuilds: GuildSummary[];
  unsavedGuilds: GuildSummary[];
};

export type GuildPermissionsShape = {
  create_roles: string[];
  confirm_roles: string[];
};

export type GuildTaskSummary = GuildDetail["tasks"][number];

export type GuildDetailResult = GuildDetail;

const fetchGuilds = async (): Promise<GuildsQueryResult> => {
  try {
    return await apiClient.get<GuildsQueryResult>("/api/guilds");
  } catch (error) {
    throw new Error(getErrorMessage(error) || "Failed to load guilds");
  }
};

type CreateGuildInput = {
  guildId: string;
  name?: string | null;
};

const createGuild = async (input: CreateGuildInput) => {
  try {
    return await apiClient.post<{ success: boolean }>("/api/guilds", {
      guildId: input.guildId,
      guildName: input.name,
    });
  } catch (error) {
    throw new Error(getErrorMessage(error) || "Failed to save guild");
  }
};

export const useGuildsQuery = () =>
  useQuery({
    queryKey: ["guilds"],
    queryFn: fetchGuilds,
  });

export const useCreateGuildMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGuild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
    },
  });
};

const fetchGuildDetail = async (
  guildId: string,
  includeTasks: boolean
): Promise<GuildDetailResult> => {
  try {
    const query = includeTasks ? "" : "?includeTasks=false";
    return await apiClient.get<GuildDetailResult>(
      `/api/guilds/${guildId}${query}`
    );
  } catch (error) {
    throw new Error(getErrorMessage(error) || "Failed to load guild");
  }
};

type UseGuildDetailOptions = {
  initialData?: GuildDetailResult;
  includeTasks?: boolean;
};

export const useGuildDetailQuery = (
  guildId: string,
  options?: UseGuildDetailOptions
) =>
  useQuery({
    queryKey: ["guild", guildId, options?.includeTasks ?? true],
    queryFn: () => fetchGuildDetail(guildId, options?.includeTasks ?? true),
    initialData: options?.initialData,
    enabled: guildId.length > 0,
  });

type UpdateGuildInput = {
  guildId: string;
  defaultRepo?: string | null;
  defaultBranch?: string | null;
  defaultJulesApiKey?: string | null;
  permissions?: GuildPermissionsShape;
  githubRepoId?: number | null;
  githubRepoName?: string | null;
  githubConnected?: boolean | null;
  githubAccessToken?: string | null;
};

const updateGuild = async ({
  guildId,
  ...payload
}: UpdateGuildInput): Promise<GuildDetailResult["guild"]> => {
  try {
    const data = await apiClient.patch<{ guild: GuildDetailResult["guild"] }>(
      `/api/guilds/${guildId}`,
      payload
    );
    return data.guild;
  } catch (error) {
    throw new Error(getErrorMessage(error) || "Failed to update guild");
  }
};

export const useUpdateGuildMutation = (guildId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<UpdateGuildInput, "guildId">) =>
      updateGuild({
        guildId,
        ...payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guild", guildId] });
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
    },
  });
};

const fetchGuildRoles = async (
  guildId: string
): Promise<{ roles: DiscordRole[]; warning?: string }> => {
  try {
    return await apiClient.get<{ roles: DiscordRole[]; warning?: string }>(
      `/api/guilds/${guildId}/roles`
    );
  } catch (error) {
    throw new Error(getErrorMessage(error) || "Failed to load roles");
  }
};

export const useGuildRolesQuery = (guildId: string) =>
  useQuery<{ roles: DiscordRole[]; warning?: string }>({
    queryKey: ["guild", guildId, "roles"],
    queryFn: () => fetchGuildRoles(guildId),
    enabled: typeof window !== "undefined" && guildId.length > 0,
    placeholderData: () => ({ roles: [], warning: undefined }),
    retry: (failureCount, error) => {
      // Don't retry for authentication or permission errors
      const errorMessage =
        error instanceof Error ? error.message.toLowerCase() : "";
      if (
        errorMessage.includes("token") ||
        errorMessage.includes("permission") ||
        errorMessage.includes("unauthorized")
      ) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff, max 30s
  });
