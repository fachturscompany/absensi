import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

        const { createClient: createAdminClient } = await import("@supabase/supabase-js");
        const admin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. My memberships
        const { data: myMembers, error: e1 } = await admin
            .from("organization_members")
            .select("id, organization_id, is_active")
            .eq("user_id", user.id);

        // 2. Check chosen org
        const chosenOrgId = myMembers?.[0]?.organization_id;

        // 3. All members in org
        const { data: orgMembers, error: e2 } = await admin
            .from("organization_members")
            .select("id, user_id, organization_id")
            .eq("organization_id", chosenOrgId);

        const allMemberIds = (orgMembers || []).map((m: any) => m.id);

        // 4. Time entries
        const { data: entries, error: e3 } = await admin
            .from("time_entries")
            .select("id, organization_member_id, entry_date, duration_seconds")
            .in("organization_member_id", allMemberIds);

        // 5. All time entries (no filter)
        const { data: allEntries, error: e4 } = await admin
            .from("time_entries")
            .select("id, organization_member_id, entry_date")
            .limit(10);

        return NextResponse.json({
            userId: user.id,
            myMembers,
            myMembersError: e1?.message,
            chosenOrgId,
            orgMembers,
            orgMembersError: e2?.message,
            allMemberIds,
            filteredEntries: entries,
            filteredEntriesError: e3?.message,
            allEntries,
            allEntriesError: e4?.message,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
