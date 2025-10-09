"use client";

import { useMemo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GuildDetailResult } from "@/lib/guilds/hooks";
import { useGuildRolesQuery } from "@/lib/guilds/hooks";
import {
  PixelCard,
  PixelCardContent,
  PixelCardDescription,
  PixelCardFooter,
  PixelCardHeader,
  PixelCardTitle,
} from "@/components/pixel-card";
import { PixelButton } from "@/components/pixel-button";
import { PixelBadge } from "@/components/pixel-badge";

type GuildOverviewProps = {
  guild: GuildDetailResult["guild"];
};

export const GuildOverview = ({ guild }: GuildOverviewProps) => {
  const rolesQuery = useGuildRolesQuery(guild.id);

  const roleNameLookup = useMemo(() => {
    if (!rolesQuery.data?.roles) {
      return new Map<string, string>();
    }

    return new Map(
      rolesQuery.data.roles.map((role) => [role.id, role.name] as const)
    );
  }, [rolesQuery.data?.roles]);

  const getRoleLabel = (roleId: string) => roleNameLookup.get(roleId);

  const isRolesLoading =
    (rolesQuery.isLoading || rolesQuery.isFetching) && !rolesQuery.isError;
  const hasRoleNames = roleNameLookup.size > 0;
  const shouldShowUnknownNames =
    rolesQuery.isFetched && !rolesQuery.isLoading && !hasRoleNames;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <header>
          <h2 className="text-xl font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground">
            High-level configuration for this Discord guild.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
          <PixelCard>
            <PixelCardHeader>
              <PixelCardTitle>GitHub Repository</PixelCardTitle>
              <PixelCardDescription>
                Connected repository for Jules tasks.
              </PixelCardDescription>
            </PixelCardHeader>
            <PixelCardContent>
              <div className="space-y-2">
                <Badge
                  variant={guild.githubConnected ? "default" : "outline"}
                  className={
                    guild.githubConnected ? "bg-green-100 text-green-800" : ""
                  }
                >
                  {guild.githubConnected ? "Connected" : "Not connected"}
                </Badge>
                {guild.githubRepoName && guild.githubConnected && (
                  <p className="text-sm font-medium">{guild.githubRepoName}</p>
                )}
                {!guild.githubConnected && guild.githubRepoName && (
                  <p className="text-xs text-muted-foreground">
                    Connect GitHub in Settings
                  </p>
                )}
              </div>
            </PixelCardContent>
            <PixelCardFooter>
              <PixelButton>
                {guild.githubConnected ? "Connected" : "Connect GitHub"}
              </PixelButton>
            </PixelCardFooter>
          </PixelCard>

          <PixelCard>
            <PixelCardHeader>
              <PixelCardTitle>Guild Jules API Key</PixelCardTitle>
              <PixelCardDescription>
                Guild-level fallback credential.
              </PixelCardDescription>
            </PixelCardHeader>

            <PixelCardFooter>
              <PixelButton>
                {guild.defaultJulesApiKeySet ? "Connected" : "Set Api Key"}
              </PixelButton>
            </PixelCardFooter>
          </PixelCard>
        </div>
      </section>

      <section className="space-y-4">
        <header>
          <h2 className="text-xl font-semibold">Discord Role Permissions</h2>
          <p className="text-sm text-muted-foreground">
            Roles authorized to create or confirm Jules automation tasks.
          </p>
        </header>
        <PermissionsList
          title="Create Roles"
          roleIds={guild.permissions.create_roles}
          emptyMessage="No create roles configured."
          getLabel={getRoleLabel}
          isLoadingNames={
            isRolesLoading &&
            guild.permissions.create_roles.length > 0 &&
            !hasRoleNames
          }
          showUnknownNames={
            shouldShowUnknownNames && guild.permissions.create_roles.length > 0
          }
        />
        <PermissionsList
          title="Confirm Roles"
          roleIds={guild.permissions.confirm_roles}
          emptyMessage="No confirm roles configured."
          getLabel={getRoleLabel}
          isLoadingNames={
            isRolesLoading &&
            guild.permissions.confirm_roles.length > 0 &&
            !hasRoleNames
          }
          showUnknownNames={
            shouldShowUnknownNames && guild.permissions.confirm_roles.length > 0
          }
        />
      </section>
    </div>
  );
};

type PermissionsListProps = {
  title: string;
  roleIds: string[];
  emptyMessage: string;
  getLabel: (roleId: string) => string | undefined;
  isLoadingNames: boolean;
  showUnknownNames: boolean;
};

const PermissionsList = ({
  title,
  roleIds,
  emptyMessage,
  getLabel,
  isLoadingNames,
  showUnknownNames,
}: PermissionsListProps) => (
  <>
    <PixelCard variant="window" title={title + ".exe"}>
      <PixelCardHeader>
        <PixelCardTitle>{title}</PixelCardTitle>
      </PixelCardHeader>
      <PixelCardContent>
        {roleIds.length > 0 ? (
          <ul className="grid gap-2 sm:grid-cols-8 w-full">
            {roleIds.map((roleId) => {
              const label = getLabel(roleId);

              return (
                <PixelBadge key={roleId} variant="outline" className="w-full">
                  {isLoadingNames ? (
                    <span
                      className="inline-flex h-4 w-24 animate-pulse rounded bg-muted-foreground/20"
                      aria-hidden="true"
                    />
                  ) : label ? (
                    label
                  ) : (
                    <span>
                      <span className="sr-only">{` (${roleId})`}</span>
                    </span>
                  )}
                </PixelBadge>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        )}
        {isLoadingNames ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Loading Discord role names…
          </p>
        ) : showUnknownNames && roleIds.length > 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Role names unavailable; Discord did not return role metadata.
          </p>
        ) : null}
      </PixelCardContent>
      <PixelCardFooter>
        <PixelButton>Edit Permissions</PixelButton>
      </PixelCardFooter>
    </PixelCard>
  </>
);
