"use client";

import { GuildOverview } from "@/features/guilds/components/guild-overview";
import { useGuildRouteContext } from "@/features/guilds/context";
import { useGuildDetailQuery } from "@/lib/guilds/hooks";
import { GuildPageLoader } from "@/features/guilds/components/guild-page-loader";
import { GuildPageError } from "@/features/guilds/components/guild-page-error";

const GuildOverviewPage = () => {
  const { guildId, initialDetail } = useGuildRouteContext();
  const { data, isLoading, isError, error, refetch } = useGuildDetailQuery(guildId, {
    initialData: initialDetail,
    includeTasks: false,
  });

  if (isLoading && !data) {
    return <GuildPageLoader />;
  }

  if (isError) {
    return (
      <GuildPageError
        message={error instanceof Error ? error.message : "Unable to load guild overview."}
        onRetry={refetch}
      />
    );
  }

  if (!data) {
    return null;
  }

  return <GuildOverview guild={data.guild} />;
};

export default GuildOverviewPage;
