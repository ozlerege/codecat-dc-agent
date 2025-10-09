"use client";

import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PixelButton } from "@/components/pixel-button";
import type { GuildDetailResult } from "@/lib/guilds/hooks";
import { cn } from "@/lib/utils";
import { GuildRoleSelector } from "@/features/guilds/components/guild-role-selector";
import type { DiscordRole } from "@/lib/discord/roles";
import {
  GitHubRepoSelector,
  useGitHubConnectionStatus,
} from "@/features/github";
import { PixelInput } from "@/components/pixel-input";
import Link from "next/link";

type GuildSettingsFormProps = {
  guild: GuildDetailResult["guild"];
  isSaving: boolean;
  onSubmit: (payload: {
    defaultRepo?: string | null;
    defaultBranch?: string | null;
    defaultJulesApiKey?: string | null;
    permissions?: GuildDetailResult["guild"]["permissions"];
    githubRepoId?: number | null;
    githubRepoName?: string | null;
    githubConnected?: boolean | null;
    githubAccessToken?: string | null;
  }) => Promise<void>;
  availableRoles: DiscordRole[];
  isLoadingRoles: boolean;
  rolesWarning?: string;
};

export const GuildSettingsForm = ({
  guild,
  isSaving,
  onSubmit,
  availableRoles,
  isLoadingRoles,
  rolesWarning,
}: GuildSettingsFormProps) => {
  const { connected } = useGitHubConnectionStatus();
  const [defaultRepo, setDefaultRepo] = useState(guild.defaultRepo ?? "");
  const [createRoles, setCreateRoles] = useState<string[]>([
    ...guild.permissions.create_roles,
  ]);
  const [confirmRoles, setConfirmRoles] = useState<string[]>([
    ...guild.permissions.confirm_roles,
  ]);
  const [newDefaultKey, setNewDefaultKey] = useState("");
  const [clearDefaultKey, setClearDefaultKey] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedGitHubRepo, setSelectedGitHubRepo] = useState<{
    id: number;
    name: string;
  } | null>(
    guild.githubRepoId && guild.githubRepoName
      ? { id: guild.githubRepoId, name: guild.githubRepoName }
      : null
  );

  useEffect(() => {
    setDefaultRepo(guild.defaultRepo ?? "");
    setCreateRoles([...guild.permissions.create_roles]);
    setConfirmRoles([...guild.permissions.confirm_roles]);
    setNewDefaultKey("");
    setClearDefaultKey(false);
    setSelectedGitHubRepo(
      guild.githubRepoId && guild.githubRepoName
        ? { id: guild.githubRepoId, name: guild.githubRepoName }
        : null
    );
  }, [
    guild.defaultRepo,
    guild.permissions,
    guild.githubRepoId,
    guild.githubRepoName,
  ]);

  const hasPermissionsChanged = useMemo(() => {
    const createChanged =
      createRoles.length !== guild.permissions.create_roles.length ||
      createRoles.some(
        (role) => !guild.permissions.create_roles.includes(role)
      );
    const confirmChanged =
      confirmRoles.length !== guild.permissions.confirm_roles.length ||
      confirmRoles.some(
        (role) => !guild.permissions.confirm_roles.includes(role)
      );

    return {
      createChanged,
      confirmChanged,
    };
  }, [createRoles, confirmRoles, guild.permissions]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedbackMessage(null);
    setErrorMessage(null);

    const payload: Parameters<typeof onSubmit>[0] = {};
    const trimmedRepo = defaultRepo.trim();

    if ((guild.defaultRepo ?? "") !== trimmedRepo) {
      payload.defaultRepo = trimmedRepo.length > 0 ? trimmedRepo : null;
    }

    if (
      hasPermissionsChanged.createChanged ||
      hasPermissionsChanged.confirmChanged
    ) {
      payload.permissions = {
        create_roles: createRoles,
        confirm_roles: confirmRoles,
      };
    }

    if (clearDefaultKey) {
      payload.defaultJulesApiKey = null;
    } else if (newDefaultKey.trim().length > 0) {
      payload.defaultJulesApiKey = newDefaultKey.trim();
    }

    // Handle GitHub repository changes
    const currentGithubRepo =
      guild.githubRepoId && guild.githubRepoName
        ? { id: guild.githubRepoId, name: guild.githubRepoName }
        : null;

    if (selectedGitHubRepo !== currentGithubRepo) {
      if (selectedGitHubRepo) {
        payload.githubRepoId = selectedGitHubRepo.id;
        payload.githubRepoName = selectedGitHubRepo.name;
        payload.githubConnected = true;
      } else {
        payload.githubRepoId = null;
        payload.githubRepoName = null;
        payload.githubConnected = false;
      }
    }

    if (Object.keys(payload).length === 0) {
      setFeedbackMessage("No changes detected.");
      return;
    }

    try {
      await onSubmit(payload);
      setFeedbackMessage("Guild settings updated.");
      setNewDefaultKey("");
      setClearDefaultKey(false);
    } catch (submissionError) {
      setErrorMessage(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to update settings."
      );
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <GitHubRepoSelector
            guildId={guild.id}
            currentRepoId={guild.githubRepoId}
            currentRepoName={guild.githubRepoName}
            onRepoChange={(repo) => {
              setSelectedGitHubRepo(
                repo ? { id: repo.id, name: repo.fullName } : null
              );
            }}
            disabled={isSaving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultKey">Guild Jules API Key</Label>
          <PixelInput
            id="defaultKey"
            type="password"
            placeholder={
              guild.defaultJulesApiKeySet
                ? "Enter new key to rotate"
                : "Provide a Jules API key"
            }
            value={newDefaultKey}
            onChange={(event) => {
              setNewDefaultKey(event.target.value);
              if (event.target.value.length > 0) {
                setClearDefaultKey(false);
              }
            }}
          />
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              <span>
                {guild.defaultJulesApiKeySet
                  ? "A guild-level key is currently configured."
                  : "No guild-level key configured. You may get a Jules API key "}
              </span>
              <Link
                href="https://developers.google.com/jules/api"
                target="_blank"
                className="text-purple-500 underline"
              >
                HERE
              </Link>
            </span>
            {guild.defaultJulesApiKeySet ? (
              <button
                type="button"
                className={cn(
                  "rounded-md border border-dashed px-3 py-1 text-xs font-medium transition-colors",
                  clearDefaultKey
                    ? "border-destructive text-destructive"
                    : "hover:border-destructive hover:text-destructive"
                )}
                onClick={() => {
                  setClearDefaultKey((state) => !state);
                  setNewDefaultKey("");
                }}
              >
                {clearDefaultKey ? "Will remove key" : "Remove key"}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <GuildRoleSelector
          label="Create Role IDs"
          description="Users in these roles can create Jules tasks."
          roles={availableRoles}
          value={createRoles}
          onChange={(roleIds) => setCreateRoles(roleIds)}
          disabled={isSaving || isLoadingRoles}
        />
        <GuildRoleSelector
          label="Confirm Role IDs"
          description="These roles can approve and fast-track automation tasks."
          roles={availableRoles}
          value={confirmRoles}
          onChange={(roleIds) => setConfirmRoles(roleIds)}
          disabled={isSaving || isLoadingRoles}
        />
      </div>

      {isLoadingRoles ? (
        <p className="text-xs text-muted-foreground">Loading Discord roles…</p>
      ) : rolesWarning ? (
        <p className="text-xs text-muted-foreground">
          Discord roles are unavailable; showing configured role IDs.
        </p>
      ) : availableRoles.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No Discord roles available. Verify the bot has access to this guild.
        </p>
      ) : null}

      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}
      {feedbackMessage ? (
        <p className="text-sm text-muted-foreground">{feedbackMessage}</p>
      ) : null}

      <PixelButton variant="inverted" type="submit" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Changes"}
      </PixelButton>
    </form>
  );
};
