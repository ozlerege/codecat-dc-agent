export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          discord_id: string;
          discord_username: string | null;
          email: string | null;
          role: "admin" | "developer";
          jules_api_key: string | null;
          github_access_token: string | null;
          github_username: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          discord_id: string;
          discord_username?: string | null;
          email?: string | null;
          role?: "admin" | "developer";
          jules_api_key?: string | null;
          github_access_token?: string | null;
          github_username?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          discord_id?: string;
          discord_username?: string | null;
          email?: string | null;
          role?: "admin" | "developer";
          jules_api_key?: string | null;
          github_access_token?: string | null;
          github_username?: string | null;
          created_at?: string;
        };
      };
      guilds: {
        Row: {
          id: string;
          guild_id: string;
          installer_user_id: string | null;
          name: string | null;
          default_repo: string | null;
          default_branch: string | null;
          permissions: GuildPermissions | null;
          default_jules_api_key: string | null;
          github_repo_id: number | null;
          github_repo_name: string | null;
          github_connected: boolean | null;
          github_access_token: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          guild_id: string;
          installer_user_id?: string | null;
          name?: string | null;
          default_repo?: string | null;
          default_branch?: string | null;
          permissions?: GuildPermissions | null;
          default_jules_api_key?: string | null;
          github_repo_id?: number | null;
          github_repo_name?: string | null;
          github_connected?: boolean | null;
          github_access_token?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          guild_id?: string;
          installer_user_id?: string | null;
          name?: string | null;
          default_repo?: string | null;
          default_branch?: string | null;
          permissions?: GuildPermissions | null;
          default_jules_api_key?: string | null;
          github_repo_id?: number | null;
          github_repo_name?: string | null;
          github_connected?: boolean | null;
          github_access_token?: string | null;
          created_at?: string | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string | null;
          discord_user_id: string;
          guild_id: string;
          prompt: string;
          status:
            | "pending_confirmation"
            | "in_progress"
            | "rejected"
            | "completed";
          pr_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          discord_user_id: string;
          guild_id: string;
          prompt: string;
          status?:
            | "pending_confirmation"
            | "in_progress"
            | "rejected"
            | "completed";
          pr_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          discord_user_id?: string;
          guild_id?: string;
          prompt?: string;
          status?:
            | "pending_confirmation"
            | "in_progress"
            | "rejected"
            | "completed";
          pr_url?: string | null;
          created_at?: string;
        };
      };
    };
  };
};

export type GuildPermissions = {
  create_roles: string[];
  confirm_roles: string[];
};
