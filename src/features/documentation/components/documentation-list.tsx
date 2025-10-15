import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { documentationEntries } from "../data/help-topics";

type DocumentationListProps = {
  readonly guildName?: string;
};

export const DocumentationList = ({ guildName }: DocumentationListProps) => (
  <section aria-labelledby="guild-documentation-heading" className="space-y-6">
    <header className="space-y-2">
      <h1
        id="guild-documentation-heading"
        className="text-2xl font-bold uppercase tracking-tight"
      >
        Documentation
      </h1>
      <p className="text-sm text-muted-foreground">
        Explore the CodeCat bot commands and workflow guidance available to
        this guild{guildName ? ` (${guildName})` : ""}. This mirrors what you
        see when running the `/help` command in Discord.
      </p>
    </header>
    <div className="grid gap-4">
      {documentationEntries.map((entry) => (
        <Card
          key={entry.id}
          className="border-2 border-border shadow-[0_0_0_2px_var(--color-border)]"
        >
          <CardHeader>
            <CardTitle className="text-base font-bold uppercase tracking-wide">
              {entry.title}
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {entry.description}
            </CardDescription>
          </CardHeader>
          {entry.notes?.length ? (
            <CardContent>
              <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                {entry.notes.map((note) => (
                  <li key={note} className="flex gap-2">
                    <span aria-hidden="true">–</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  </section>
);
