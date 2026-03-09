"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/profile&image/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, UserX, RefreshCw, Phone } from "lucide-react";
import { logout } from "@/action/users";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { getUserInitials } from "@/lib/avatar-utils";
import { useProfilePhotoUrl } from "@/hooks/use-profile";

import { accountLogger } from '@/lib/logger';
type UserProfile = {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  profile_photo_url?: string;
  employee_code?: string;
};

type MemberInfo = {
  employee_id?: string;
  department_name?: string;
  position_title?: string;
};

export default function AccountInactivePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [checking, setChecking] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const supabase = createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }

        // Get user profile
        const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (userProfile) {
          setProfile(userProfile);
        }

        // Get member info
        const { data: member } = await supabase
          .from("organization_members")
          .select(`
            employee_id,
            departments:department_id (name),
            positions:position_id (title)
          `)
          .eq("user_id", user.id)
          .maybeSingle();

        if (member) {
          setMemberInfo({
            employee_id: member.employee_id,
            department_name: (member.departments as any)?.name,
            position_title: (member.positions as any)?.title,
          });
        }
      } catch (error) {
        accountLogger.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [router]);

  const photoUrl = useProfilePhotoUrl(profile?.profile_photo_url);

  // Auto-check status every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      await checkStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data: member } = await supabase
        .from("organization_members")
        .select("is_active")
        .eq("user_id", user.id)
        .maybeSingle();

      if (member?.is_active) {
        toast.success("Account activated! Redirecting...");
        router.replace('/');
        router.refresh();
      }
    } catch (error) {
      accountLogger.error("Error checking status:", error);
    }
  };

  const handleRefresh = async () => {
    setChecking(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in again");
        router.push("/auth/login");
        return;
      }

      const { data: member } = await supabase
        .from("organization_members")
        .select("is_active")
        .eq("user_id", user.id)
        .maybeSingle();

      if (member?.is_active) {
        toast.success("Account activated! Redirecting to dashboard...");
        router.replace('/');
        router.refresh();
      } else {
        toast.info("Your account is still inactive. Please contact your administrator.");
      }
    } catch (error) {
      toast.error("Failed to check account status");
    } finally {
      setChecking(false);
    }
  };

  // Hide sidebar and navbar
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
      toast.error(result.error || "Failed to sign out");
    }
  };

  const fullName = profile
    ? [profile.first_name, profile.last_name]
      .filter(Boolean)
      .join(" ")
    : "User";

  if (loading) {
    return (
      <div className="fixed inset-0 min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 min-h-screen bg-background flex items-center justify-center px-4 z-50">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        {/* Profile Section */}
        <div className="space-y-4">
          {/* Profile Photo with Status Badge */}
          <div className="relative inline-block">
            <Avatar className="h-20 w-20 border-2 border-background shadow-lg mx-auto">
              <AvatarImage src={photoUrl || undefined} alt={fullName} />
              <AvatarFallback className="text-xl font-bold">
                {getUserInitials(
                  profile?.first_name,
                  profile?.last_name,
                  undefined,
                  profile?.email
                )}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
              <Badge variant="destructive" className="text-xs shadow-lg">
                <UserX className="w-3 h-3 mr-1" />
                Inactive
              </Badge>
            </div>
          </div>

          {/* User Name */}
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {fullName}
            </h1>
            {profile?.employee_code && (
              <p className="text-xs text-muted-foreground mt-1">
                {profile.employee_code}
              </p>
            )}
          </div>

          {/* Compact Info Badges */}
          {memberInfo && (
            <div className="flex flex-wrap gap-2 justify-center text-xs">
              {memberInfo.employee_id && (
                <Badge variant="secondary">ID: {memberInfo.employee_id}</Badge>
              )}
              {memberInfo.department_name && (
                <Badge variant="outline">{memberInfo.department_name}</Badge>
              )}
              {memberInfo.position_title && (
                <Badge variant="outline">{memberInfo.position_title}</Badge>
              )}
            </div>
          )}

          {/* Contact Info */}
          {(profile?.email || profile?.mobile || profile?.phone) && (
            <div className="flex flex-col gap-1 items-center text-xs text-muted-foreground">
              {profile?.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  <span>{profile.email}</span>
                </div>
              )}
              {(profile?.mobile || profile?.phone) && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{profile.mobile || profile.phone}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Message */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            Account Deactivated
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your account has been deactivated by your organization administrator.
            Please contact your HR department or system administrator to reactivate your account.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleRefresh}
            disabled={checking}
            className="w-full flex items-center gap-2 hover:scale-105 transition-transform duration-200 bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Check Account Status'}
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="flex-1 hover:scale-105 transition-transform duration-200"
            >
              Sign Out
            </Button>

            <a href="mailto:hr@company.com?subject=Account%20Reactivation%20Request" className="flex-1">
              <Button
                variant="outline"
                className="w-full hover:scale-105 transition-transform duration-200"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact HR
              </Button>
            </a>
          </div>
        </div>

        {/* Additional Help */}
        <div className="pt-8 border-t border-border space-y-3">
          <p className="text-xs text-muted-foreground">
            💡 The system automatically checks your account status every 30 seconds
          </p>
          <p className="text-xs text-muted-foreground/60">
            Once reactivated, you&apos;ll be automatically redirected to the dashboard
          </p>
        </div>

        {/* Footer */}
        <div className="text-xs text-muted-foreground/60">
          Error Code: 403 - Account Inactive
        </div>
      </div>
    </div>
  );
}
