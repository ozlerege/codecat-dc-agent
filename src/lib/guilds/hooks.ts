import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GuildDetail } from "@/lib/guilds/service";

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
  const response = await fetch("/api/guilds", {
    credentials: "include",
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMessage = (errorBody as { error?: string }).error ?? "Failed to load guilds";
    throw new Error(errorMessage);
  }

  return response.json() as Promise<GuildsQueryResult>;
};

type CreateGuildInput = {
  guildId: string;
};

const createGuild = async (input: CreateGuildInput) => {
  const response = await fetch("/api/guilds", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMessage = (errorBody as { error?: string }).error ?? "Failed to save guild";
    throw new Error(errorMessage);
  }

  return response.json() as Promise<{ success: boolean }>;
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

const fetchGuildDetail = async (guildId: string, includeTasks: boolean): Promise<GuildDetailResult> => {
  const query = includeTasks ? "" : "?includeTasks=false";
  const response = await fetch(`/api/guilds/${guildId}${query}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMessage = (errorBody as { error?: string }).error ?? "Failed to load guild";
    throw new Error(errorMessage);
  }

  return response.json() as Promise<GuildDetailResult>;
};

type UseGuildDetailOptions = {
  initialData?: GuildDetailResult;
  includeTasks?: boolean;
};

export const useGuildDetailQuery = (guildId: string, options?: UseGuildDetailOptions) =>
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
};

const updateGuild = async ({
  guildId,
  ...payload
}: UpdateGuildInput): Promise<GuildDetailResult["guild"]> => {
  const response = await fetch(`/api/guilds/${guildId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMessage = (errorBody as { error?: string }).error ?? "Failed to update guild";
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as { guild: GuildDetailResult["guild"] };
  return data.guild;
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
