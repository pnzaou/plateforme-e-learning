import { Skeleton } from "@/components/ui/skeleton";

const AcademiqueListSkeleton = ({ count = 4, columns = 2 }) => {
  const gridCls =
    columns === 2 ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "grid gap-3";

  return (
    <div className={gridCls}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-16 rounded-md" />
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AcademiqueListSkeleton;
