"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useOrganizationData } from "@/hooks/use-organization-data";
import { accountLogger } from '@/lib/logger';

/**
 * AccountStatusChecker Component
 * 
 * Checks if the current user's account (organization_member) is active.
 * If inactive, redirects to /account-inactive page.
 * 
 * Uses centralized organization data hook to avoid duplicate requests.
 */
export default function AccountStatusChecker({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: orgData, isSuccess } = useOrganizationData();

  useEffect(() => {
    // Skip check on these pages
    const excludedPaths = [
      "/account-inactive",
      "/organization-inactive", 
      "/subscription-expired",
      "/auth/login",
      "/auth/signup",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/verify-email",
      "/onboarding",
    ];

    if (excludedPaths.some(path => pathname.startsWith(path))) {
      return;
    }

    if (isSuccess && orgData) {
      // If member exists but is inactive, redirect
      if (orgData.memberIsActive === false) {
        accountLogger.debug("Account is inactive, redirecting to /account-inactive");
        router.replace("/account-inactive");
      }
    }
  }, [pathname, router, orgData, isSuccess]);

  // Render children
  return <>{children}</>;
}
