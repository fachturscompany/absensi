// src/hooks/organization/settings/use-settings-page-skeleton.tsx
// Hook yang merender full-page skeleton untuk settings page
// Dipakai di page.tsx (TanStack Query loading) dan loading.tsx (Next.js route loading)

import {
  OrgSettingsHeaderSkeleton,
  BasicInfoCardSkeleton,
  ContactLocationCardSkeleton,
  PreferencesCardSkeleton,
  DangerZoneCardSkeleton,
} from "@/components/organization/settings/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export function useSettingsPageSkeleton() {
  const SettingsPageSkeleton = () => (
    <div className="flex flex-1 flex-col w-full">
      <div className="p-6 w-full overflow-x-auto">
        {/* Header: logo, org name, badge, invite code */}
        <OrgSettingsHeaderSkeleton />

        {/* 2-column: Basic Info + Contact Location */}
        <div className="grid gap-6 lg:grid-cols-2">
          <BasicInfoCardSkeleton />
          <ContactLocationCardSkeleton />
        </div>

        {/* Full width: Preferences */}
        <div className="mt-6">
          <PreferencesCardSkeleton />
        </div>

        {/* Danger Zone */}
        <DangerZoneCardSkeleton />

        {/* Save button */}
        <div className="flex justify-end pt-6">
          <Skeleton className="h-12 w-40 rounded-md" />
        </div>
      </div>
    </div>
  );

  return { SettingsPageSkeleton };
}