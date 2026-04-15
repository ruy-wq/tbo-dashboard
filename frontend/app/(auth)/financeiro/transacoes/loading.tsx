import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function TransacoesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-44 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>

      {/* Summary cards — 3 */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-3 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-[140px] rounded-md" />
        <Skeleton className="h-9 flex-1 max-w-sm rounded-md" />
        <Skeleton className="h-9 w-[160px] rounded-md" />
        <Skeleton className="h-9 w-[180px] rounded-md" />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {/* Header row */}
          <div className="flex items-center gap-4 px-4 py-3 border-b">
            {[40, 200, 120, 120, 100, 90, 80, 80, 70, 40].map((w, i) => (
              <Skeleton key={i} className="h-3" style={{ width: w }} />
            ))}
          </div>
          {/* Data rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border/40">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-20 ml-auto" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="size-6 rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
