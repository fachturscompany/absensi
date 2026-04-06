"use client";

import * as React from "react";
import { ChevronsUpDown, Building2, Plus, Check } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/user-store";
import { useOrgStore } from "@/store/org-store";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function OrganizationSwitcher() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const queryClient = useQueryClient();   const { userOrganizations } = useAuthStore();
  const { organizationId, setOrganizationId } = useOrgStore();

  const [isSwitching, setIsSwitching] = React.useState(false);
  const switchingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const activeOrg = React.useMemo(() => {
    return (
      userOrganizations?.find((org) => org.organization_id === organizationId) ||
      userOrganizations?.[0] ||
      null
    );
  }, [userOrganizations, organizationId]);

  const [selectedOrg, setSelectedOrg] = React.useState<
    typeof userOrganizations[0] | null
  >(activeOrg);

  React.useEffect(() => {
    if (activeOrg) {
      if (activeOrg.id !== selectedOrg?.id) {
        setSelectedOrg(activeOrg);
      }
      if (activeOrg.organization_id !== organizationId) {
        console.log("[ORG-SWITCHER] Auto-fixing organization ID:", activeOrg.organization_id);
        setOrganizationId(activeOrg.organization_id, activeOrg.organization_name);

        fetch("/api/organizations/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId: activeOrg.organization_id }),
        }).catch(console.error);
      }
    }
  }, [activeOrg, selectedOrg, organizationId, setOrganizationId]);

  // Handle switching organization
  const handleSwitchOrg = async (org: typeof userOrganizations[0]) => {
    // Prevent multiple rapid switches
    if (isSwitching) {
      console.log("[ORG-SWITCHER] Switch already in progress, ignoring click");
      return;
    }

    // Prevent switching to same organization
    if (org.organization_id === organizationId) {
      console.log("[ORG-SWITCHER] Already on this organization");
      return;
    }

    try {
      setIsSwitching(true);
      console.log("[ORG-SWITCHER] Starting switch to:", org.organization_id);

      // Step 1: Update UI immediately (optimistic update)
      setSelectedOrg(org);

      // Step 2: Update global store
      setOrganizationId(org.organization_id, org.organization_name);

      // Step 3: Set cookie on server (wait for this to complete)
      console.log("[ORG-SWITCHER] Setting server cookie...");
      const cookieResponse = await fetch("/api/organizations/select", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizationId: org.organization_id }),
      });

      if (!cookieResponse.ok) {
        throw new Error(
          `Failed to set organization cookie: ${cookieResponse.statusText}`,
        );
      }

      console.log("[ORG-SWITCHER] Cookie set successfully");

      // ✅ Step 4: Invalidate semua query organization agar settings page
      // langsung fetch data org baru tanpa menunggu staleTime habis
      console.log("[ORG-SWITCHER] Invalidating organization queries...");
      await queryClient.invalidateQueries({ queryKey: ["organization"] });

      // Step 5: Refresh server components
      console.log("[ORG-SWITCHER] Refreshing page data...");
      router.refresh();

      // Clear switching state after a short delay to allow UI to update
      switchingTimeoutRef.current = setTimeout(() => {
        setIsSwitching(false);
      }, 1000);
    } catch (error) {
      console.error("[ORG-SWITCHER] Error switching organization:", error);

      // Fallback: Try setting cookie manually if API fails
      try {
        document.cookie = `org_id=${org.organization_id}; path=/; max-age=31536000`;
        console.log("[ORG-SWITCHER] Fallback: Cookie set via document.cookie");

        // ✅ Tetap invalidate query meski API gagal
        await queryClient.invalidateQueries({ queryKey: ["organization"] });

        router.refresh();

        switchingTimeoutRef.current = setTimeout(() => {
          setIsSwitching(false);
        }, 1000);
      } catch (fallbackError) {
        console.error(
          "[ORG-SWITCHER] Fallback failed, doing hard reload:",
          fallbackError,
        );
        // Only hard reload if everything else fails
        window.location.href = window.location.href;
      }
    }
  };

  React.useEffect(() => {
    return () => {
      if (switchingTimeoutRef.current) {
        clearTimeout(switchingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={selectedOrg?.organization_name || "Select Organization"}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {/* Logo container — saat collapsed ini yang tampil sebagai ikon */}
              <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md overflow-hidden border border-sidebar-border/50">
                {selectedOrg?.logo_url ? (
                  <img
                    src={selectedOrg.logo_url}
                    alt={selectedOrg.organization_name}
                    className="size-full object-cover"
                  />
                ) : (
                  <Building2 className="size-4 text-sidebar-foreground/70" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {selectedOrg?.organization_name || "Select Organization"}
                </span>
                <span className="truncate text-xs">
                  {selectedOrg ? "Active" : "No Organization"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            {userOrganizations?.map((org, index) => (
              <DropdownMenuItem
                key={org.id || index}
                onClick={() => handleSwitchOrg(org)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border overflow-hidden">
                  {org.logo_url ? (
                    <img
                      src={org.logo_url}
                      alt={org.organization_name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Building2 className="size-4 shrink-0" />
                  )}
                </div>
                {org.organization_name}
                {selectedOrg?.id === org.id && (
                  <Check className="ml-auto size-4" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" asChild>
              <Link href="/onboarding/setup">
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">
                  Add Organization
                </div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}