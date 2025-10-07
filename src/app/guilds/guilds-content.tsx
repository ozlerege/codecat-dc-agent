"use client";
import { useState, ReactNode } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { SelectGuildButton } from "./select-guild-button";
import { useCreateGuildMutation, useGuildsQuery } from "@/lib/guilds/hooks";
import { buildGuildIconUrl } from "@/lib/discord/guilds";

type GuildsContentProps = {
  initialUserName: string;
};

export const GuildsContent = ({ initialUserName }: GuildsContentProps) => {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useGuildsQuery();
  const createGuildMutation = useCreateGuildMutation();
  const [activeGuildId, setActiveGuildId] = useState<string | null>(null);

  const userName = data?.userName ?? initialUserName;
  const savedGuilds = data?.savedGuilds ?? [];
  const unsavedGuilds = data?.unsavedGuilds ?? [];

  const handleSelectGuild = async (guildId: string) => {
    try {
      setActiveGuildId(guildId);
      await createGuildMutation.mutateAsync({ guildId });
    } catch (mutationError) {
      console.error("Failed to save guild:", mutationError);
    } finally {
      setActiveGuildId(null);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between max-w-7xl mx-auto mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {userName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your Discord guilds and development tasks
          </p>
        </div>
        <SignOutButton />
      </header>

      <main className="max-w-7xl mx-auto space-y-12">
        {(isLoading || isFetching) && !data ? <GuildsSkeleton /> : null}

        {isError ? (
          <ErrorState
            message={
              error instanceof Error ? error.message : "Unable to load guilds."
            }
            onRetry={refetch}
          />
        ) : null}

        {!isLoading && !isError ? (
          <>
            <GuildSection
              title="Saved Servers"
              description="Servers already connected to Jules."
              guilds={savedGuilds}
              emptyMessage="No saved servers yet."
            />
            <GuildSection
              title="Unsaved Servers"
              description="Select a server to connect it with Jules and start managing tasks."
              guilds={unsavedGuilds}
              emptyMessage="All available servers are already configured."
              renderAction={(guildId) => (
                <SelectGuildButton
                  onSelect={() => handleSelectGuild(guildId)}
                  isLoading={
                    createGuildMutation.isPending && activeGuildId === guildId
                  }
                  disabled={
                    createGuildMutation.isPending && activeGuildId !== guildId
                  }
                />
              )}
            />
          </>
        ) : null}

        {createGuildMutation.isError ? (
          <p className="text-sm text-destructive">
            {(createGuildMutation.error as Error).message ??
              "Failed to save guild. Please try again."}
          </p>
        ) : null}
      </main>
    </div>
  );
};

type GuildSectionProps = {
  title: string;
  description: string;
  guilds: { id: string; name: string; icon: string | null }[];
  emptyMessage: string;
  renderAction?: (guildId: string) => ReactNode;
};

const GuildSection = ({
  title,
  description,
  guilds,
  emptyMessage,
  renderAction,
}: GuildSectionProps) => {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm mt-1">{description}</p>
      </div>

      {guilds.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-center text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {guilds.map((guild) => (
            <div
              key={guild.id}
              className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={buildGuildIconUrl(guild)}
                  alt={`${guild.name} icon`}
                  className="h-12 w-12 rounded-full border object-cover"
                />
                <div>
                  <h3 className="text-lg font-semibold leading-none">
                    {guild.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    ID: {guild.id}
                  </p>
                </div>
              </div>

              {renderAction ? (
                <div className="pt-2">{renderAction(guild.id)}</div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This server is already configured.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm mt-1">{message}</p>
    </div>
    <button
      onClick={() => onRetry()}
      className="inline-flex items-center justify-center rounded-md border border-destructive px-4 py-2 text-sm font-medium hover:bg-destructive hover:text-destructive-foreground transition-colors"
    >
      Try again
    </button>
  </div>
);

const GuildsSkeleton = () => (
  <div className="space-y-8">
    {[0, 1].map((section) => (
      <section key={`skeleton-${section}`} className="space-y-4">
        <div className="space-y-2">
          <div className="h-6 w-40 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((card) => (
            <div
              key={`skeleton-card-${section}-${card}`}
              className="rounded-lg border bg-card p-6 space-y-4"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </section>
    ))}
  </div>
);
