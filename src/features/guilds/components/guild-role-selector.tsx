"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  PixelSelect,
  PixelSelectTrigger,
  PixelSelectValue,
  PixelSelectContent,
  PixelSelectItem,
} from "@/components/pixel-select";
import type { DiscordRole } from "@/lib/discord/roles";
import { cn } from "@/lib/utils";
import { PixelBadge } from "@/components/pixel-badge";
import { PixelButton } from "@/components/pixel-button";
import { SelectGroup } from "@/components/ui/select";

type GuildRoleSelectorProps = {
  label: string;
  description?: string;
  placeholder?: string;
  roles: DiscordRole[];
  value: string[];
  onChange: (roleIds: string[]) => void;
  disabled?: boolean;
};

export const GuildRoleSelector = ({
  label,
  description,
  placeholder = "Select Discord roles",
  roles,
  value,
  onChange,
  disabled = false,
}: GuildRoleSelectorProps) => {
  const [selectedRole, setSelectedRole] = useState<string | undefined>(
    undefined
  );

  const orderedRoles = useMemo(
    () => [...roles].sort((a, b) => b.position - a.position),
    [roles]
  );

  useEffect(() => {
    if (
      selectedRole &&
      !orderedRoles.some((role) => role.id === selectedRole)
    ) {
      setSelectedRole(undefined);
    }
  }, [orderedRoles, selectedRole]);

  const handleSelectRole = (roleId: string) => {
    if (!value.includes(roleId)) {
      onChange([...value, roleId]);
    }

    setSelectedRole(roleId);
    requestAnimationFrame(() => setSelectedRole(undefined));
  };

  const handleRemoveRole = (roleId: string) => {
    onChange(value.filter((current) => current !== roleId));
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label>{label}</Label>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <PixelSelect
        value={selectedRole}
        onValueChange={handleSelectRole}
        disabled={disabled || orderedRoles.length === 0}
      >
        <PixelSelectTrigger aria-label={label}>
          <PixelSelectValue placeholder={placeholder} />
        </PixelSelectTrigger>
        <PixelSelectContent>
          <SelectGroup>
            {orderedRoles.map((role) => (
              <PixelSelectItem
                key={role.id}
                value={role.id}
                disabled={value.includes(role.id)}
              >
                {role.name}
              </PixelSelectItem>
            ))}
          </SelectGroup>
        </PixelSelectContent>
      </PixelSelect>

      <div
        className={cn(
          "flex flex-wrap gap-2 rounded-lg border border-dashed bg-muted/30 p-3",
          value.length === 0 && "text-sm text-muted-foreground"
        )}
      >
        {value.length === 0 ? (
          <span>No roles selected.</span>
        ) : (
          value.map((roleId) => {
            const role = orderedRoles.find(
              (candidate) => candidate.id === roleId
            );
            const roleLabel = role ? role.name : roleId;

            return (
              <PixelBadge key={roleId} variant="outline">
                <div className="flex items-center gap-2">
                  <span>{roleLabel}</span>
                  <PixelButton
                    type="button"
                    variant="ghost"
                    onClick={() => handleRemoveRole(roleId)}
                    className="pr-0 px-2 py-0.5 text-xs text-secondary-foreground hover:bg-secondary-foreground/20"
                    disabled={disabled}
                    aria-label={`Remove role ${roleLabel}`}
                  >
                    X
                  </PixelButton>
                </div>
              </PixelBadge>
            );
          })
        )}
      </div>
    </div>
  );
};
