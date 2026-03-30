// src/components/organization/settings/skeletons/header-skeleton.tsx

import { Skeleton } from "@/components/ui/skeleton";

export function OrgSettingsHeaderSkeleton() {
  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Logo */}
        <Skeleton className="w-20 h-20 rounded-lg shrink-0" />

        {/* Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-80" />

          {/* Invite code row */}
          <div className="flex items-center gap-3 mt-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-7 w-24 rounded" />
            <Skeleton className="h-7 w-7 rounded" />
            <Skeleton className="h-7 w-7 rounded" />
            <Skeleton className="h-7 w-7 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}