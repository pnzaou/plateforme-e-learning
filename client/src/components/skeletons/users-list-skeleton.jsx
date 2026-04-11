import { Skeleton } from "@/components/ui/skeleton";

const UsersListSkeleton = ({ count = 5 }) => {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default UsersListSkeleton;