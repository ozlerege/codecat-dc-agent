"use client";

import { GuildSettingsForm } from "@/features/guilds/components/guild-settings-form";
import { useGuildRouteContext } from "@/features/guilds/context";
import {
  useGuildDetailQuery,
  useGuildRolesQuery,
  useUpdateGuildMutation,
} from "@/lib/guilds/hooks";
import { GuildPageLoader } from "@/features/guilds/components/guild-page-loader";
import { GuildPageError } from "@/features/guilds/components/guild-page-error";
import { InviteBotButton } from "@/features/guilds/components/invite-bot-button";

const GuildSettingsPage = () => {
  const { guildId, initialDetail } = useGuildRouteContext();
  const { data, isLoading, isError, error, refetch } = useGuildDetailQuery(
    guildId,
    {
      initialData: initialDetail,
      includeTasks: false,
    }
  );
  const updateMutation = useUpdateGuildMutation(guildId);
  const rolesQuery = useGuildRolesQuery(guildId);

  const handleSubmit = async (
    payload: Parameters<typeof updateMutation.mutateAsync>[0]
  ) => {
    await updateMutation.mutateAsync(payload);
    await refetch();
  };

  if (isLoading && !data) {
    return <GuildPageLoader />;
  }

  if (isError || !data) {
    return (
      <GuildPageError
        message={
          error instanceof Error
            ? error.message
            : "Unable to load guild settings."
        }
        onRetry={refetch}
      />
    );
  }

  const availableRoles = rolesQuery.data?.roles ?? [];
  const rolesWarning = rolesQuery.data?.warning;
  const showRolesError = rolesQuery.isFetched && rolesQuery.isError;
  const showRolesWarning = rolesQuery.isFetched && !rolesQuery.isError && rolesWarning;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Update integration defaults for this guild.
        </p>
      </header>

      {showRolesError ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">
                Unable to load Discord roles
              </p>
              <p className="text-xs text-destructive/80">
                {rolesQuery.error instanceof Error
                  ? rolesQuery.error.message
                  : "An unknown error occurred while fetching roles."}
              </p>
              <p className="text-xs text-muted-foreground">
                This might be due to missing bot permissions or an invalid
                Discord token.
              </p>
            </div>
            <button
              type="button"
              onClick={() => rolesQuery.refetch()}
              disabled={rolesQuery.isFetching}
              className="rounded-md bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/20 disabled:opacity-50"
            >
              {rolesQuery.isFetching ? "Retrying..." : "Retry"}
            </button>
          </div>
          <InviteBotButton
            className="mt-3"
            label="Invite bot with required permissions"
            guildId={guildId}
          />
        </div>
      ) : showRolesWarning ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/10 p-4 text-xs text-muted-foreground">
          Discord roles could not be fetched from the API. Showing existing
          configured role IDs instead.
          <InviteBotButton
            className="mt-3"
            label="Invite bot to this guild"
            guildId={guildId}
          />
        </div>
      ) : null}

      <GuildSettingsForm
        guild={data.guild}
        isSaving={updateMutation.isPending}
        onSubmit={handleSubmit}
        availableRoles={availableRoles}
        isLoadingRoles={rolesQuery.isLoading}
        rolesWarning={rolesWarning}
      />
    </div>
  );
};

export default GuildSettingsPage;
