import { Skeleton } from "@/components/ui/skeleton";

const CourseDetailSkeleton = () => (
  <div className="space-y-6 max-w-5xl">
    <Skeleton className="h-5 w-24" />
    <div className="glass rounded-lg p-6 space-y-4">
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
    <Skeleton className="h-6 w-32" />
    {Array.from({ length: 3 }).map((_, i) => (
      <Skeleton key={i} className="h-20 w-full rounded-lg" />
    ))}
  </div>
);

export default CourseDetailSkeleton;