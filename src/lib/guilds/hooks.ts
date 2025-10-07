import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

