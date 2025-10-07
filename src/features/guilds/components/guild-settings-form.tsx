"use client";

import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { GuildDetailResult } from "@/lib/guilds/hooks";
import { cn } from "@/lib/utils";
import { GuildRoleSelector } from "@/features/guilds/components/guild-role-selector";
import type { DiscordRole } from "@/lib/discord/roles";

type GuildSettingsFormProps = {
  guild: GuildDetailResult["guild"];
  isSaving: boolean;
  onSubmit: (payload: {
    defaultRepo?: string | null;
    defaultBranch?: string | null;
    defaultJulesApiKey?: string | null;
    permissions?: GuildDetailResult["guild"]["permissions"];
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
  const [defaultRepo, setDefaultRepo] = useState(guild.defaultRepo ?? "");
  const [defaultBranch, setDefaultBranch] = useState(guild.defaultBranch ?? "");
  const [createRoles, setCreateRoles] = useState<string[]>([...guild.permissions.create_roles]);
  const [confirmRoles, setConfirmRoles] = useState<string[]>([...guild.permissions.confirm_roles]);
  const [newDefaultKey, setNewDefaultKey] = useState("");
  const [clearDefaultKey, setClearDefaultKey] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setDefaultRepo(guild.defaultRepo ?? "");
    setDefaultBranch(guild.defaultBranch ?? "");
    setCreateRoles([...guild.permissions.create_roles]);
    setConfirmRoles([...guild.permissions.confirm_roles]);
    setNewDefaultKey("");
    setClearDefaultKey(false);
  }, [guild.defaultRepo, guild.defaultBranch, guild.permissions]);

  const hasPermissionsChanged = useMemo(() => {
    const createChanged =
      createRoles.length !== guild.permissions.create_roles.length ||
      createRoles.some((role) => !guild.permissions.create_roles.includes(role));
    const confirmChanged =
      confirmRoles.length !== guild.permissions.confirm_roles.length ||
      confirmRoles.some((role) => !guild.permissions.confirm_roles.includes(role));

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
    const trimmedBranch = defaultBranch.trim();

    if ((guild.defaultRepo ?? "") !== trimmedRepo) {
      payload.defaultRepo = trimmedRepo.length > 0 ? trimmedRepo : null;
    }

    if ((guild.defaultBranch ?? "") !== trimmedBranch) {
      payload.defaultBranch = trimmedBranch.length > 0 ? trimmedBranch : null;
    }

    if (hasPermissionsChanged.createChanged || hasPermissionsChanged.confirmChanged) {
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="defaultRepo">Default Repository</Label>
          <Input
            id="defaultRepo"
            placeholder="owner/repository"
            value={defaultRepo}
            onChange={(event) => setDefaultRepo(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultBranch">Default Branch</Label>
          <Input
            id="defaultBranch"
            placeholder="main"
            value={defaultBranch}
            onChange={(event) => setDefaultBranch(event.target.value)}
          />
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

      <div className="space-y-2">
        <Label htmlFor="defaultKey">Guild Jules API Key</Label>
        <Input
          id="defaultKey"
          type="password"
          placeholder={
            guild.defaultJulesApiKeySet ? "Enter new key to rotate" : "Provide a Jules API key"
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
            {guild.defaultJulesApiKeySet
              ? "A guild-level key is currently configured."
              : "No guild-level key configured."}
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

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      {feedbackMessage ? <p className="text-sm text-muted-foreground">{feedbackMessage}</p> : null}

      <Button type="submit" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
};
