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
          created_at: string;
        };
        Insert: {
          id: string;
          discord_id: string;
          discord_username?: string | null;
          email?: string | null;
          role?: "admin" | "developer";
          jules_api_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          discord_id?: string;
          discord_username?: string | null;
          email?: string | null;
          role?: "admin" | "developer";
          jules_api_key?: string | null;
          created_at?: string;
        };
      };
      guilds: {
        Row: {
          id: string;
          guild_id: string;
          installer_user_id: string;
          default_repo: string | null;
          default_branch: string;
          permissions: GuildPermissions;
          default_jules_api_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          guild_id: string;
          installer_user_id: string;
          default_repo?: string | null;
          default_branch?: string;
          permissions?: GuildPermissions;
          default_jules_api_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          guild_id?: string;
          installer_user_id?: string;
          default_repo?: string | null;
          default_branch?: string;
          permissions?: GuildPermissions;
          default_jules_api_key?: string | null;
          created_at?: string;
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
