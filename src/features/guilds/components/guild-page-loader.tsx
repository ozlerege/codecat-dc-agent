import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const GuildPageLoader = () => (
  <div className="space-y-8">
    <Skeleton className="h-8 w-64" />
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((index) => (
        <Card key={`loader-card-${index}`}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[0, 1, 2].map((item) => (
          <Skeleton key={`loader-row-${item}`} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  </div>
);

