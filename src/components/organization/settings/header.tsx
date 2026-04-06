"use client";

// src/components/organization/settings/OrgSettingsHeader.tsx

import { Badge } from "@/components/ui/badge";
import { Building2 } from "@/components/icons/lucide-exports";
import { InviteCodeControl } from "./invite-code";
import type { OrganizationData } from "@/types/organization/org-settings";

interface OrgSettingsHeaderProps {
  orgData: OrganizationData | null | undefined;
  logoPreview: string | null;
  // Invite code props
  showInviteCode: boolean;
  inviteCodeCopied: boolean;
  regenerating: boolean;
  onToggleShow: () => void;
  onCopy: () => void;
  onRegenerate: () => void;
}

export function OrgSettingsHeader({
  orgData,
  logoPreview,
  showInviteCode,
  inviteCodeCopied,
  regenerating,
  onToggleShow,
  onCopy,
  onRegenerate,
}: OrgSettingsHeaderProps) {
  const displayLogo = logoPreview || orgData?.logo_url;

  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Logo */}
        <div className="shrink-0">
          <div className="w-20 h-20 rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center">
            {displayLogo ? (
              <img
                src={displayLogo}
                alt={`${orgData?.name || "Organization"} logo`}
                className="block w-full h-full object-cover"
              />
            ) : (
              <Building2 className="h-10 w-10 text-muted-foreground/50" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{orgData?.name || "Organization Settings"}</h1>
            <Badge
              variant="secondary"
              className={
                orgData?.is_active
                  ? "bg-slate-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-400/30"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200 border border-amber-200 dark:border-amber-400/30"
              }
            >
              {orgData?.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          <p className="text-muted-foreground">
            Manage your organization information, settings, and preferences
          </p>

          <InviteCodeControl
            invCode={orgData?.inv_code}
            showInviteCode={showInviteCode}
            inviteCodeCopied={inviteCodeCopied}
            regenerating={regenerating}
            onToggleShow={onToggleShow}
            onCopy={onCopy}
            onRegenerate={onRegenerate}
          />
        </div>
      </div>
    </div>
  );
}