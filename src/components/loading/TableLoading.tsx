import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TableLoadingProps {
  title?: string;
  rows?: number;
  cols?: number;
  showHeader?: boolean;
}

export function TableLoading({
  title,
  rows = 5,
  cols = 4,
  showHeader = true,
}: TableLoadingProps) {
  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle>
            {title ? title : <Skeleton className="h-6 w-24" />}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="rounded-md border">
          <div className="border-b bg-muted/50 p-4">
            <div className="flex items-center gap-4">
              {Array.from({ length: cols }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  {Array.from({ length: cols }).map((_, j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
