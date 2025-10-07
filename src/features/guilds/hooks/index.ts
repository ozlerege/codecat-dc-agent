/**
 * Guild Hooks
 * 
 * React hooks for guild data fetching and mutations.
 * Uses React Query for caching and state management.
 * 
 * @module features/guilds/hooks
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/types";
import type {
  GuildsQueryResult,
  GuildDetailResult,
  CreateGuildInput,
  UpdateGuildInput,
  GuildRolesResult,
} from "../types";

/**
 * Fetch all guilds for the current user
 */
const fetchGuilds = async (): Promise<GuildsQueryResult> => {
  try {
    return await apiClient.get<GuildsQueryResult>("/api/guilds");
  } catch (error) {
    throw new Error(getErrorMessage(error) || "Failed to load guilds");
  }
};

/**
 * Create a new guild
 */
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

/**
 * Hook to fetch guilds list
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useGuildsQuery();
 * 
 * if (isLoading) return <Spinner />;
 * 
 * return (
 *   <div>
 *     <h2>Saved Guilds: {data?.savedGuilds.length}</h2>
 *     <h2>Unsaved Guilds: {data?.unsavedGuilds.length}</h2>
 *   </div>
 * );
 * ```
 */
export const useGuildsQuery = () =>
  useQuery({
    queryKey: ["guilds"],
    queryFn: fetchGuilds,
  });

/**
 * Hook to create a new guild
 * 
 * @example
 * ```tsx
 * const createMutation = useCreateGuildMutation();
 * 
 * const handleCreate = () => {
 *   createMutation.mutate({
 *     guildId: '123456789',
 *     name: 'My Guild'
 *   });
 * };
 * ```
 */
export const useCreateGuildMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGuild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
    },
  });
};

/**
 * Fetch guild detail
 */
const fetchGuildDetail = async (
  guildId: string,
  includeTasks: boolean
): Promise<GuildDetailResult> => {
  try {
    const query = includeTasks ? "" : "?includeTasks=false";
    return await apiClient.get<GuildDetailResult>(`/api/guilds/${guildId}${query}`);
  } catch (error) {
    throw new Error(getErrorMessage(error) || "Failed to load guild");
  }
};

/**
 * Options for guild detail query
 */
type UseGuildDetailOptions = {
  initialData?: GuildDetailResult;
  includeTasks?: boolean;
};

/**
 * Hook to fetch guild detail
 * 
 * @param guildId - Guild ID
 * @param options - Query options
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useGuildDetailQuery('123456789', {
 *   includeTasks: true
 * });
 * 
 * if (isLoading) return <Spinner />;
 * if (!data) return <NotFound />;
 * 
 * return (
 *   <div>
 *     <h1>{data.guild.name}</h1>
 *     <p>Tasks: {data.tasks.length}</p>
 *   </div>
 * );
 * ```
 */
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

/**
 * Update guild
 */
const updateGuild = async (
  input: UpdateGuildInput & { guildId: string }
): Promise<GuildDetailResult["guild"]> => {
  try {
    const { guildId, ...payload } = input;
    const data = await apiClient.patch<{ guild: GuildDetailResult["guild"] }>(
      `/api/guilds/${guildId}`,
      payload
    );
    return data.guild;
  } catch (error) {
    throw new Error(getErrorMessage(error) || "Failed to update guild");
  }
};

/**
 * Hook to update guild
 * 
 * @param guildId - Guild ID
 * 
 * @example
 * ```tsx
 * const updateMutation = useUpdateGuildMutation('123456789');
 * 
 * const handleUpdate = () => {
 *   updateMutation.mutate({
 *     defaultBranch: 'develop',
 *     defaultRepo: 'owner/repo'
 *   });
 * };
 * ```
 */
export const useUpdateGuildMutation = (guildId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateGuildInput) =>
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

/**
 * Fetch guild roles
 */
const fetchGuildRoles = async (guildId: string): Promise<GuildRolesResult> => {
  try {
    return await apiClient.get<GuildRolesResult>(`/api/guilds/${guildId}/roles`);
  } catch (error) {
    throw new Error(getErrorMessage(error) || "Failed to load roles");
  }
};

/**
 * Hook to fetch guild roles
 * 
 * @param guildId - Guild ID
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useGuildRolesQuery('123456789');
 * 
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * 
 * return (
 *   <ul>
 *     {data?.roles.map(role => (
 *       <li key={role.id}>{role.name}</li>
 *     ))}
 *   </ul>
 * );
 * ```
 */
export const useGuildRolesQuery = (guildId: string) =>
  useQuery<GuildRolesResult>({
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
