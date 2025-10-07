import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type GuildPageErrorProps = {
  message: string;
  onRetry: () => void;
};

export const GuildPageError = ({ message, onRetry }: GuildPageErrorProps) => (
  <Card className="border-destructive/50 bg-destructive/10">
    <CardHeader>
      <CardTitle className="text-destructive">Unable to load content</CardTitle>
      <CardDescription>{message}</CardDescription>
    </CardHeader>
    <CardContent>
      <Button variant="destructive" onClick={onRetry}>
        Retry
      </Button>
    </CardContent>
  </Card>
);

