"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export interface SettingsMember {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    activityScore: number;
}

/**
 * Fetches members from Supabase for settings pages.
 * Only returns members with real emails (excludes @example.com and similar dummy emails).
 */
export async function getSettingsMembers(explicitOrgId?: string): Promise<{
    success: boolean;
    data: SettingsMember[];
    message?: string;
}> {
    try {
        const supabase = await createClient();
        const adminClient = createAdminClient();

        let organizationId: string | number | undefined = explicitOrgId;

        if (!organizationId) {
            // Get current user's organization
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                return { success: false, message: "User not logged in", data: [] };
            }

            // Get user's organization
            const { data: member } = await supabase
                .from("organization_members")
                .select("organization_id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (!member?.organization_id) {
                return { success: true, message: "User not in any organization", data: [] };
            }

            organizationId = member.organization_id;
        }

        // Fetch organization members with their user profiles
        const { data: members, error: membersError } = await adminClient
            .from("organization_members")
            .select(`
        id,
        user:user_id (
          id,
          email,
          first_name,
          last_name,
          display_name,
          profile_photo_url
        )
      `)
            .eq("organization_id", organizationId)
            .eq("is_active", true);

        if (membersError) {
            return { success: false, message: membersError.message, data: [] };
        }

        if (!members || members.length === 0) {
            return { success: true, data: [] };
        }

        // Filter out members with dummy emails and transform to SettingsMember format
        // Patterns for dummy/fake emails to exclude
        const dummyEmailPatterns = [
            "@example.com",
            "@example.org",
            "@example.net",
            "@test.com",
            "@test.org",
            "@dummy.com",
            "@dummy.local",  // Added for local dummy emails
            ".local",        // Any .local domain is dummy
            "@fake.com",
            "@placeholder.com",
            "@mail.com",
            "@email.com",
            "@temp.com",
            "@tempmail.com",
            "@mailinator.com",
            "@yopmail.com",
            "@guerrillamail.com",
            "@10minutemail.com",
            "@throwaway.com",
            "@noemail.com",
            "@none.com",
            "@no.email",
            "@invalid.com"
        ];

        // Function to check if email is valid and real
        const isValidRealEmail = (email: string): boolean => {
            if (!email || email.trim() === "") return false;

            // Basic email format check
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) return false;

            const lowerEmail = email.toLowerCase();

            // Check against dummy patterns
            if (dummyEmailPatterns.some(pattern => lowerEmail.endsWith(pattern))) {
                return false;
            }

            // Check for common invalid local parts
            const localPart = lowerEmail.split("@")[0] ?? "";
            const invalidLocalParts = ["test", "dummy", "fake", "user", "admin", "null", "undefined", "none", "noemail", "no-email", "temp"];
            if (invalidLocalParts.includes(localPart)) {
                return false;
            }

            return true;
        };

        const settingsMembers: SettingsMember[] = [];

        for (const m of members) {
            const userProfile = m.user as any;

            // Skip members without user profile (no user_id linked)
            if (!userProfile) continue;

            const email = (userProfile.email || "").trim();

            // Skip if email is not valid or is a dummy email
            if (!isValidRealEmail(email)) continue;

            // Build display name
            const firstName = userProfile.first_name || "";
            const lastName = userProfile.last_name || "";
            const displayName = userProfile.display_name || "";

            const fullName = [firstName, lastName]
                .filter(Boolean)
                .join(" ")
                .trim();

            const name = displayName || fullName || email.split("@")[0];

            // Build avatar URL
            const avatar = userProfile.profile_photo_url || undefined;

            // Generate a random activity score (since we don't have real activity data)
            const activityScore = Math.floor(Math.random() * 30) + 70; // 70-100

            settingsMembers.push({
                id: String(m.id),
                name,
                email,
                avatar,
                activityScore,
            });
        }

        return { success: true, data: settingsMembers };
    } catch (error) {
        console.error("Error fetching settings members:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
            data: [],
        };
    }
}
