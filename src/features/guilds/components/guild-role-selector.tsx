"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DiscordRole } from "@/lib/discord/roles";
import { cn } from "@/lib/utils";

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
  const [selectedRole, setSelectedRole] = useState<string | undefined>(undefined);

  const orderedRoles = useMemo(() => [...roles].sort((a, b) => b.position - a.position), [roles]);

  useEffect(() => {
    if (selectedRole && !orderedRoles.some((role) => role.id === selectedRole)) {
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

      <Select
        value={selectedRole}
        onValueChange={handleSelectRole}
        disabled={disabled || orderedRoles.length === 0}
      >
        <SelectTrigger aria-label={label}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {orderedRoles.map((role) => (
              <SelectItem key={role.id} value={role.id} disabled={value.includes(role.id)}>
                {role.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

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
            const role = orderedRoles.find((candidate) => candidate.id === roleId);
            const roleLabel = role ? role.name : roleId;

            return (
              <Badge key={roleId} variant="secondary" className="gap-2">
                <span>{roleLabel}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRole(roleId)}
                  className="rounded-full bg-secondary-foreground/10 px-2 py-0.5 text-xs text-secondary-foreground hover:bg-secondary-foreground/20"
                  disabled={disabled}
                  aria-label={`Remove role ${roleLabel}`}
                >
                  Remove
                </button>
              </Badge>
            );
          })
        )}
      </div>
    </div>
  );
};
