// src/app/organization/settings/loading.tsx
// Ditampilkan otomatis oleh Next.js App Router saat navigasi ke halaman ini
// Skeleton layout sama persis dengan page.tsx agar tidak ada layout shift

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// ----------------------------------------------------------
// Skeleton: Header (logo + org name + invite code)
// ----------------------------------------------------------
function OrgSettingsHeaderSkeleton() {
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

// ----------------------------------------------------------
// Skeleton: Basic Info Card
// ----------------------------------------------------------
function BasicInfoCardSkeleton() {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-36" />
        </div>
        <Skeleton className="h-4 w-56 mt-1" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo uploader */}
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>

        <Separator />

        {/* Name */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-3 w-64" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-20 w-full rounded-md" />
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------
// Skeleton: Contact & Location Card
// ----------------------------------------------------------
function ContactLocationCardSkeleton() {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-4 w-52 mt-1" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        <Separator />

        {/* Address */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Country + State */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>

        {/* City + Postal */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------
// Skeleton: Preferences Card
// ----------------------------------------------------------
function PreferencesCardSkeleton() {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-4 w-64 mt-1" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timezone */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-1/2 rounded-md" />
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-1/2 rounded-md" />
        </div>

        <Separator />

        {/* Time Format */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-1/2 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------
// Skeleton: Danger Zone Card
// ----------------------------------------------------------
function DangerZoneCardSkeleton() {
  return (
    <Card className="border border-destructive/20 shadow-sm mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-4 w-72 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------
// Loading — default export wajib untuk Next.js
// ----------------------------------------------------------
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

        {/* Save button skeleton */}
        <div className="flex justify-end pt-6">
          <Skeleton className="h-12 w-40 rounded-md" />
        </div>
      </div>
    </div>
  );
}