"use client";

import { GuildTasks } from "@/features/guilds/components/guild-tasks";
import { useGuildRouteContext } from "@/features/guilds/context";
import { useGuildDetailQuery } from "@/lib/guilds/hooks";
import { GuildPageLoader } from "@/features/guilds/components/guild-page-loader";
import { GuildPageError } from "@/features/guilds/components/guild-page-error";

const GuildTasksPage = () => {
  const { guildId } = useGuildRouteContext();
  const { data, isLoading, isError, error, refetch } = useGuildDetailQuery(guildId, {
    includeTasks: true,
  });

  if (isLoading && !data) {
    return <GuildPageLoader />;
  }

  if (isError || !data) {
    return (
      <GuildPageError
        message={error instanceof Error ? error.message : "Unable to load guild tasks."}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">Recent Tasks</h2>
        <p className="text-sm text-muted-foreground">
          Latest CodeCat automation activity for this guild.
        </p>
      </header>
      <GuildTasks tasks={data.tasks} />
    </div>
  );
};

export default GuildTasksPage;

