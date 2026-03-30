"use client";

// src/app/organization/settings/page.tsx

import { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2, RotateCw } from "@/components/icons/lucide-exports";

import { useOrgSettings } from "@/hooks/organization/settings/use-org-settings";
import { useLogoUpload } from "@/hooks/organization/settings/use-logo-upload";
import { useInviteCode } from "@/hooks/organization/settings/use-invite-code";
import { useSettingsPageSkeleton } from "@/hooks/organization/settings/use-settings-page-skeleton";

import { OrgSettingsHeader } from "@/components/organization/settings/header";
import { BasicInfoCard } from "@/components/organization/settings/basic-info-card";
import { ContactLocationCard } from "@/components/organization/settings/contact-location-card";
import { PreferencesCard } from "@/components/organization/settings/preferences-card";
import { DangerZoneCard } from "@/components/organization/settings/danger-zone-card";

import type { OrganizationData } from "@/types/organization/org-settings";

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { SettingsPageSkeleton } = useSettingsPageSkeleton();

  const {
    orgData,
    formData,
    setFormData,
    loading,
    saving,
    countryOptions,
    stateOptions,
    cityOptions,
    stateLabel,
    cityLabel,
    handleCountryChange,
    handleSave,
    handleDiscard,
    geoLoading,
  } = useOrgSettings();

  const { logoPreview, isCompressing, compressionError, handleLogoChange, resolveLogoUrl } =
    useLogoUpload(orgData);

  const handleOrgDataRefresh = useCallback((_data: OrganizationData) => {
    // useOrgSettings refetch otomatis via queryClient, ini hanya untuk fallback
  }, []);

  const {
    showInviteCode,
    inviteCodeCopied,
    regenerating,
    toggleShowInviteCode,
    copyInviteCode,
    handleRegenerate,
  } = useInviteCode(orgData, handleOrgDataRefresh);

  const handleChange = useCallback(
    (updates: Partial<typeof formData>) => {
      setFormData((prev) => ({ ...prev, ...updates }));
    },
    [setFormData],
  );

  const onSave = useCallback(async () => {
    const { url, ok } = await resolveLogoUrl();
    if (!ok) return;
    await handleSave(url);
  }, [resolveLogoUrl, handleSave]);

  if (loading || !mounted) {
    return <SettingsPageSkeleton />;
  }

  return (
    <div className="flex flex-1 flex-col w-full">
      <div className="p-6 w-full overflow-x-auto">
        <OrgSettingsHeader
          orgData={orgData}
          logoPreview={logoPreview}
          showInviteCode={showInviteCode}
          inviteCodeCopied={inviteCodeCopied}
          regenerating={regenerating}
          onToggleShow={toggleShowInviteCode}
          onCopy={copyInviteCode}
          onRegenerate={handleRegenerate}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <BasicInfoCard
            formData={formData}
            onChange={handleChange}
            logoPreview={logoPreview}
            orgName={orgData?.name}
            isCompressing={isCompressing}
            compressionError={compressionError}
            onLogoChange={handleLogoChange}
          />

          <ContactLocationCard
            formData={formData}
            onChange={handleChange}
            onCountryChange={handleCountryChange}
            countryOptions={countryOptions}
            stateOptions={stateOptions}
            cityOptions={cityOptions}
            stateLabel={stateLabel}
            cityLabel={cityLabel}
            geoLoading={geoLoading}
          />
        </div>

        <div className="mt-6">
          <PreferencesCard formData={formData} onChange={handleChange} />
        </div>

        <DangerZoneCard orgData={orgData} />

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-6">
          {/* ✅ Tombol Discard — reset form ke data server */}
          <Button
            onClick={handleDiscard}
            disabled={saving}
            size="lg"
            variant="outline"
            className="min-w-[140px] gap-2 px-6 py-3 text-base font-semibold"
          >
            <RotateCw className="h-4 w-4" />
            Discard
          </Button>

          <Button
            onClick={onSave}
            disabled={saving}
            size="lg"
            className="min-w-[160px] gap-2 px-6 py-3 text-base font-semibold"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}