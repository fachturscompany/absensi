"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mail, Clock, RefreshCw } from "lucide-react";
import { logout } from "@/action/users";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { checkOrganizationStatus } from "@/action/organization";
import { toast } from "sonner";

import { logger } from '@/lib/logger';
export default function SubscriptionExpiredPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(false);
  const [expirationDate] = useState<string | null>(() => {
    // Only read date parameter once on initial mount
    return searchParams.get('date');
  });

  // Auto-check status every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      await checkStatus();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const status = await checkOrganizationStatus();

      // If subscription is now valid, redirect to dashboard
      if (status.isValid) {
        toast.success("Subscription renewed! Redirecting...");
        router.replace('/');
        router.refresh();
      }
    } catch (error) {
      logger.error("Error checking status:", error);
    }
  };

  const handleRefresh = async () => {
    setChecking(true);
    try {
      const status = await checkOrganizationStatus();

      if (status.isValid) {
        toast.success("Subscription renewed! Redirecting to dashboard...");
        router.replace('/');
        router.refresh();
      } else {
        toast.info("Subscription is still expired. Please contact support.");
      }
    } catch (error) {
      toast.error("Failed to check subscription status");
    } finally {
      setChecking(false);
    }
  };

  // Hide sidebar and navbar on mount
  useEffect(() => {
    const sidebar = document.querySelector('[data-sidebar]') || document.querySelector('aside');
    const navbar = document.querySelector('[data-navbar]') || document.querySelector('nav');

    if (sidebar instanceof HTMLElement) sidebar.style.display = 'none';
    if (navbar instanceof HTMLElement) navbar.style.display = 'none';

    document.body.style.marginLeft = '0';

    return () => {
      if (sidebar instanceof HTMLElement) sidebar.style.display = '';
      if (navbar instanceof HTMLElement) navbar.style.display = '';
      document.body.style.marginLeft = '';
    };
  }, []);

  const handleSignOut = async () => {
    const result = await logout();
    if (result.success) {
      queryClient.clear();
      router.refresh();
      router.replace("/auth/login");
    } else {
      alert(result.error || "Failed to sign out");
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-background flex items-center justify-center px-4 z-50">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        {/* Illustration */}
        <div className="relative animate-bounce-slow">
          <div className="text-8xl font-bold text-muted-foreground/20 select-none">
            402
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Clock className="w-16 h-16 text-muted-foreground/40 animate-pulse" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-foreground">
            Subscription Expired
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your organization&apos;s subscription has expired
            {expirationDate && (() => {
              try {
                const formattedDate = new Date(expirationDate + 'T00:00:00').toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
                return (
                  <span className="block mt-3 font-medium text-base text-foreground">
                    Expired on: {formattedDate}
                  </span>
                );
              } catch {
                return null;
              }
            })()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 justify-center">
          <Button
            onClick={handleRefresh}
            disabled={checking}
            className="flex items-center gap-2 w-full hover:scale-105 transition-transform duration-200 bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Check Subscription Status'}
          </Button>

          <a href="mailto:support@absensi.app?subject=Subscription%20Expired%20-%20Renewal%20Request">
            <Button
              variant="outline"
              className="flex items-center gap-2 w-full hover:scale-105 transition-transform duration-200"
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </Button>
          </a>

          <Button
            variant="outline"
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full hover:scale-105 transition-transform duration-200"
          >
            Sign Out
          </Button>
        </div>

        {/* Additional Help */}
        <div className="pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">
            After renewing your subscription, click &quot;Check Subscription Status&quot; above
          </p>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              The system automatically checks every 30 seconds
            </p>
            <p className="text-xs text-muted-foreground/60">
              For support: support@absensi.app
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-muted-foreground/60">
          Error Code: 402 - Payment Required
        </div>
      </div>
    </div>
  );
}
