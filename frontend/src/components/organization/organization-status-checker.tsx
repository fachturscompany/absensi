"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { checkOrganizationStatus, OrganizationStatus } from "@/action/organization";

import { organizationLogger } from '@/lib/logger';

interface OrganizationStatusCheckerProps {
  children: React.ReactNode;
}

export default function OrganizationStatusChecker({ children }: OrganizationStatusCheckerProps) {
  const [_status, setStatus] = useState<OrganizationStatus | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't check if already on status pages
    if (pathname === '/organization-inactive' || pathname === '/subscription-expired') {
      return;
    }

    async function checkStatus() {
      // Check cache first to avoid redundant server calls
      const CACHE_KEY = 'org_status_cache';
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { status, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setStatus(status);
            // If valid cache exists, we can return early, BUT we still might want to check
            // if we need to redirect (logic below). 
            // Ideally we just process the status as if we fetched it.
            handleStatusResult(status);
            return;
          }
        }
      } catch (e) {
        // Ignore storage errors
      }

      try {
        const result = await checkOrganizationStatus();
        setStatus(result);

        // Save to cache
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ status: result, timestamp: Date.now() }));
        } catch (e) {
          // Ignore storage errors
        }

        handleStatusResult(result);
      } catch (error) {
        // Handle different types of errors more gracefully
        if (error instanceof Error) {
          // Network errors (fetch failures)
          if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
            organizationLogger.warn("Network error checking organization status - failing open");
          }
          // Server response errors
          else if (error.message.includes('unexpected response')) {
            organizationLogger.warn("Server response error checking organization status - failing open");
          }
          // Other errors
          else {
            organizationLogger.error("Failed to check organization status:", error.message);
          }
        } else {
          organizationLogger.warn("Unknown error checking organization status - failing open");
        }

        setStatus({ isValid: true }); // Fail open untuk menghindari lock-out
      }
    }

    function handleStatusResult(result: OrganizationStatus) {
      // Redirect to appropriate page if organization is not valid
      if (!result.isValid && result.reason && result.reason !== "not_found") {
        if (result.reason === "inactive") {
          router.replace('/organization-inactive');
        } else if (result.reason === "expired") {
          // Extract only date part (YYYY-MM-DD) from ISO timestamp
          let dateOnly = '';
          if (result.expirationDate) {
            try {
              dateOnly = new Date(result.expirationDate).toISOString().split('T')[0] || '';
            } catch {
              dateOnly = result.expirationDate.split('T')[0] || ''; // Fallback
            }
          }
          const expiredUrl = dateOnly
            ? `/subscription-expired?date=${dateOnly}`
            : '/subscription-expired';
          router.replace(expiredUrl);
        }
      }
    }

    checkStatus();

    // Recheck every 5 minutes
    const interval = setInterval(() => {
      // Clear cache before re-checking in interval to force fresh fetch
      sessionStorage.removeItem('org_status_cache');
      checkStatus();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [pathname, router]);

  // Render children immediately without blocking loading state
  return <>{children}</>;
}
