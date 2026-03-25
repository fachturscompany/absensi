"use client";

// src/app/organization/settings/page.tsx
// Thin page — hanya compose komponen dan wire hooks

import { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "@/components/icons/lucide-exports";

import { useOrgSettings } from "@/hooks/organization/settings/use-org-settings";
import { useLogoUpload } from "@/hooks/organization/settings/use-logo-upload";
import { useInviteCode } from "@/hooks/organization/settings/use-invite-code";

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

  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------
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

  // ----------------------------------------------------------
  // Unified change handler — partial update untuk formData
  // ----------------------------------------------------------
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
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col w-full">
      <div className="p-6 w-full overflow-x-auto">
        {/* Header: Logo, nama org, status badge, invite code */}
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

        {/* Form: 2 kolom untuk Basic Info dan Contact/Location */}
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
          />
        </div>

        {/* Preferences: timezone, currency, time format — full width */}
        <div className="mt-6">
          <PreferencesCard formData={formData} onChange={handleChange} />
        </div>

        {/* Danger Zone */}
        <DangerZoneCard orgData={orgData} />

        {/* Save Button */}
        <div className="flex justify-end pt-6">
          <Button
            onClick={onSave}
            disabled={saving}
            size="lg"
            className="min-w-[160px] gap-2 px-6 py-3 text-base font-semibold bg-black text-white hover:bg-black/90 disabled:opacity-60"
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