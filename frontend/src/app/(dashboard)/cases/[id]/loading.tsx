import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingCaseDetails() {
  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-hidden p-4" role="status" aria-label="Loading case details">
      <div className="flex items-center gap-3 border-b pb-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="flex flex-1 gap-3 overflow-hidden">
        <div className="w-[30%] min-w-72 space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
