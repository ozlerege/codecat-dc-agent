import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GuildDetailResult } from "@/lib/guilds/hooks";

type GuildOverviewProps = {
  guild: GuildDetailResult["guild"];
};

export const GuildOverview = ({ guild }: GuildOverviewProps) => {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <header>
          <h2 className="text-xl font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground">
            High-level configuration for this Discord guild.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Default Repository</CardTitle>
              <CardDescription>Target repo for generated pull requests.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {guild.defaultRepo ? guild.defaultRepo : <span className="text-muted-foreground">Not configured</span>}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Default Branch</CardTitle>
              <CardDescription>Branch used when none is provided.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {guild.defaultBranch ? guild.defaultBranch : <span className="text-muted-foreground">Not configured</span>}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Guild Jules API Key</CardTitle>
              <CardDescription>Guild-level fallback credential.</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant={guild.defaultJulesApiKeySet ? "default" : "outline"}>
                {guild.defaultJulesApiKeySet ? "Configured" : "Not set"}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <header>
          <h2 className="text-xl font-semibold">Discord Role Permissions</h2>
          <p className="text-sm text-muted-foreground">
            Roles authorized to create or confirm Jules automation tasks.
          </p>
        </header>
        <PermissionsList title="Create Roles" roleIds={guild.permissions.create_roles} emptyMessage="No create roles configured." />
        <PermissionsList title="Confirm Roles" roleIds={guild.permissions.confirm_roles} emptyMessage="No confirm roles configured." />
      </section>
    </div>
  );
};

type PermissionsListProps = {
  title: string;
  roleIds: string[];
  emptyMessage: string;
};

const PermissionsList = ({ title, roleIds, emptyMessage }: PermissionsListProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {roleIds.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {roleIds.map((roleId) => (
            <li key={roleId} className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
              {roleId}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      )}
    </CardContent>
  </Card>
);

