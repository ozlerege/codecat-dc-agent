import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GuildTaskSummary } from "@/lib/guilds/hooks";

type GuildTasksProps = {
  tasks: GuildTaskSummary[];
};

export const GuildTasks = ({ tasks }: GuildTasksProps) => {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
        No tasks recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold">{task.prompt}</CardTitle>
            <TaskStatusBadge status={task.status} />
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {task.prUrl ? (
              <a
                href={task.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                View Pull Request
              </a>
            ) : null}
            <p>Created: {formatTimestamp(task.createdAt)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const TaskStatusBadge = ({
  status,
}: {
  status: GuildTaskSummary["status"];
}) => {
  switch (status) {
    case "completed":
      return <Badge variant="default">Completed</Badge>;
    case "in_progress":
      return <Badge variant="secondary">In Progress</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    case "pending_confirmation":
      return <Badge variant="outline">Pending confirmation</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const formatTimestamp = (value: string | null) => {
  if (!value) {
    return "Unknown";
  }

  try {
    const date = new Date(value);
    return date.toLocaleString();
  } catch {
    return value;
  }
};

