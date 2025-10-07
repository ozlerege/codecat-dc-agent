"use client";

import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { GuildDetailResult } from "@/lib/guilds/hooks";
import { cn } from "@/lib/utils";

type GuildSettingsFormProps = {
  guild: GuildDetailResult["guild"];
  isSaving: boolean;
  onSubmit: (payload: {
    defaultRepo?: string | null;
    defaultBranch?: string | null;
    defaultJulesApiKey?: string | null;
    permissions?: GuildDetailResult["guild"]["permissions"];
  }) => Promise<void>;
};

export const GuildSettingsForm = ({ guild, isSaving, onSubmit }: GuildSettingsFormProps) => {
  const [defaultRepo, setDefaultRepo] = useState(guild.defaultRepo ?? "");
  const [defaultBranch, setDefaultBranch] = useState(guild.defaultBranch ?? "");
  const [createRoleIds, setCreateRoleIds] = useState(
    guild.permissions.create_roles.join(", ")
  );
  const [confirmRoleIds, setConfirmRoleIds] = useState(
    guild.permissions.confirm_roles.join(", ")
  );
  const [newDefaultKey, setNewDefaultKey] = useState("");
  const [clearDefaultKey, setClearDefaultKey] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setDefaultRepo(guild.defaultRepo ?? "");
    setDefaultBranch(guild.defaultBranch ?? "");
    setCreateRoleIds(guild.permissions.create_roles.join(", "));
    setConfirmRoleIds(guild.permissions.confirm_roles.join(", "));
    setNewDefaultKey("");
    setClearDefaultKey(false);
  }, [guild.defaultRepo, guild.defaultBranch, guild.permissions]);

  const parseRoleIds = (value: string) =>
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

  const hasPermissionsChanged = useMemo(() => {
    const nextCreateRoles = parseRoleIds(createRoleIds);
    const nextConfirmRoles = parseRoleIds(confirmRoleIds);

    const createChanged =
      nextCreateRoles.length !== guild.permissions.create_roles.length ||
      nextCreateRoles.some((role) => !guild.permissions.create_roles.includes(role));
    const confirmChanged =
      nextConfirmRoles.length !== guild.permissions.confirm_roles.length ||
      nextConfirmRoles.some((role) => !guild.permissions.confirm_roles.includes(role));

    return {
      createChanged,
      confirmChanged,
      nextCreateRoles,
      nextConfirmRoles,
    };
  }, [createRoleIds, confirmRoleIds, guild.permissions]);

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
        create_roles: hasPermissionsChanged.nextCreateRoles,
        confirm_roles: hasPermissionsChanged.nextConfirmRoles,
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="createRoles">Create Role IDs</Label>
          <Input
            id="createRoles"
            placeholder="Comma separated role IDs"
            value={createRoleIds}
            onChange={(event) => setCreateRoleIds(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Provide Discord role IDs separated by commas.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmRoles">Confirm Role IDs</Label>
          <Input
            id="confirmRoles"
            placeholder="Comma separated role IDs"
            value={confirmRoleIds}
            onChange={(event) => setConfirmRoleIds(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Users in these roles can approve tasks instantly.
          </p>
        </div>
      </div>

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

