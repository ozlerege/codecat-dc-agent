/**
 * Documentation entries shown in the guild sidebar.
 * Mirrors the information provided by the /help command in the Discord bot.
 */
export type DocumentationEntry = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly notes?: readonly string[];
};

export const documentationEntries: readonly DocumentationEntry[] = [
  {
    id: "codecat",
    title: "/codecat <branch> <task>",
    description:
      "Propose a CodeCat task in the configured repository. Provide the branch name, task description, and optionally override the repository.",
  },
  {
    id: "connect-github",
    title: "/connect-github",
    description:
      "Link your GitHub account so CodeCat can open PRs on your behalf.",
    notes: [
      "The connected GitHub user must have push access to the configured repository.",
    ],
  },
  {
    id: "current-repo",
    title: "/current_repo",
    description:
      "View the current repository configuration, default branch, and permission settings.",
  },
  {
    id: "help",
    title: "/help",
    description: "Show an overview of available CodeCat commands.",
  },
  {
    id: "update",
    title: "/update",
    description:
      "Server owner command to refresh role permissions for pending tasks.",
    notes: [
      "If you own the server, this command runs immediately when invoked.",
      "After role changes, ask the server owner to run this so permissions refresh instantly.",
    ],
  },
  {
    id: "confirm-role",
    title: "Confirm role guidance",
    description:
      "Members with a confirm role can start tasks immediately without additional approval.",
  },
  {
    id: "create-role",
    title: "Create role guidance",
    description:
      "Members with only a create role need a confirm-role moderator to approve tasks before CodeCat starts working.",
  },
];
