"use client";

import { GuildSettingsForm } from "@/features/guilds/components/guild-settings-form";
import { useGuildRouteContext } from "@/features/guilds/context";
import { useGuildDetailQuery, useUpdateGuildMutation } from "@/lib/guilds/hooks";
import { GuildPageLoader } from "@/features/guilds/components/guild-page-loader";
import { GuildPageError } from "@/features/guilds/components/guild-page-error";

const GuildSettingsPage = () => {
  const { guildId, initialDetail } = useGuildRouteContext();
  const { data, isLoading, isError, error, refetch } = useGuildDetailQuery(guildId, {
    initialData: initialDetail,
    includeTasks: false,
  });
  const updateMutation = useUpdateGuildMutation(guildId);

  const handleSubmit = async (payload: Parameters<typeof updateMutation.mutateAsync>[0]) => {
    await updateMutation.mutateAsync(payload);
    await refetch();
  };

  if (isLoading && !data) {
    return <GuildPageLoader />;
  }

  if (isError || !data) {
    return (
      <GuildPageError
        message={error instanceof Error ? error.message : "Unable to load guild settings."}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Update integration defaults for this guild.
        </p>
      </header>
      <GuildSettingsForm guild={data.guild} isSaving={updateMutation.isPending} onSubmit={handleSubmit} />
    </div>
  );
};

export default GuildSettingsPage;

