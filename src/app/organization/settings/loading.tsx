// src/app/organization/settings/loading.tsx
// Ditampilkan otomatis oleh Next.js App Router saat navigasi ke halaman ini

import {
  OrgSettingsHeaderSkeleton,
  BasicInfoCardSkeleton,
  ContactLocationCardSkeleton,
  PreferencesCardSkeleton,
  DangerZoneCardSkeleton,
} from "@/components/organization/settings/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrgSettingsLoading() {
  return (
    <div className="flex flex-1 flex-col w-full">
      <div className="p-6 w-full overflow-x-auto">
        <OrgSettingsHeaderSkeleton />

        <div className="grid gap-6 lg:grid-cols-2">
          <BasicInfoCardSkeleton />
          <ContactLocationCardSkeleton />
        </div>

        <div className="mt-6">
          <PreferencesCardSkeleton />
        </div>

        <DangerZoneCardSkeleton />

        <div className="flex justify-end pt-6">
          <Skeleton className="h-12 w-40 rounded-md" />
        </div>
      </div>
    </div>
  );
}