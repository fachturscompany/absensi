"use server";

import { createClient } from "@/utils/supabase/server";

import { attendanceLogger } from '@/lib/logger';
// Returns aggregated attendance counts grouped by group
export const getAttendanceByGroup = async (organizationId?: string) => {
  const supabase = await createClient();

  if (!organizationId) {
    return { success: true, data: [] };
  }

  // First, get all members of the organization with their groups
  // First fetch valid groups for this organization to ensure we only get groups that belong to this org
  // Let's first check what groups exist for this organization
  const { error: groupError } = await supabase
    .from('departments')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  if (groupError) {
    attendanceLogger.error("Error fetching valid groups:", groupError);
    return { success: false, data: [] };
  }

  // Get members with their groups - explicitly use the correct relationship
  const { data: members, error: membersError } = await supabase
    .from('organization_members')
    .select(`
      id,
      department_id,
      departments!organization_members_department_id_fkey (
        id,
        name,
        organization_id
      )
    `)
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  if (membersError) {
    attendanceLogger.error("Error fetching organization members:", membersError);
    return { success: false, data: [] };
  }

  // Create a map of member IDs to their group names for quick lookup
  const memberGroupMap = new Map<string, string>();
  
  if (!members) {
    return { success: false, data: [] };
  }
  
  // Try to map embedded group first, but only accept groups that belong to this organization
  type EmbeddedGroup = {
    id: string;
    name: string;
    organization_id?: string | null;
  };

  type MemberRow = {
    id: string;
    department_id: string | null;
    departments?: EmbeddedGroup[] | EmbeddedGroup | null;
    department?: EmbeddedGroup | null;
    departments_organization_members_department_id_fkey?: EmbeddedGroup[] | EmbeddedGroup | null;
  };

  members.forEach((member: MemberRow) => {
    const raw = member.departments || member.department || member.departments_organization_members_department_id_fkey;
    if (!raw) return;

    let candidate: EmbeddedGroup | null = null;
    if (Array.isArray(raw) && raw.length > 0) candidate = raw[0] ?? null;
    else if (raw && !Array.isArray(raw) && typeof raw === "object") {
      candidate = raw;
    }

    if (candidate && candidate.name) {
      // Only map if the group belongs to the requested organization
      if (String(candidate.organization_id) === String(organizationId)) {
        memberGroupMap.set(member.id, candidate.name);
      } else {
        // Skip groups that belong to other organizations (data inconsistency)
        attendanceLogger.warn(`Skipping group mapping for member ${member.id} because group org ${candidate.organization_id} !== ${organizationId}`);
      }
    }
  });

  // Fallback: if embedding failed or produced no mappings, fetch group names by department_id
  if (memberGroupMap.size === 0) {

    const groupIds = Array.from(
      new Set(
        members
          .map((member: MemberRow) => member.department_id)
          .filter((id): id is string => Boolean(id))
      )
    );
    if (groupIds.length > 0) {
      const { data: groups, error: groupFetchErr } = await supabase
        .from('departments')
        .select('id, name, organization_id')
        .in('id', groupIds)
        .eq('organization_id', organizationId);

      if (!groupFetchErr && groups) {
        type GroupRow = { id: string; name: string };

        const groupMap = new Map<string, string>(
          (groups as GroupRow[]).map((group) => [group.id, group.name])
        );

        members.forEach((member: MemberRow) => {
          if (!member.department_id) {
            return;
          }

          const name = groupMap.get(member.department_id);
          if (name) {
            memberGroupMap.set(member.id, name);
          } else {
            attendanceLogger.warn(
              `Member ${member.id} references department_id ${member.department_id} which is not a group in organization ${organizationId}`
            );
          }
        });
      } else {
        attendanceLogger.warn('Failed to fetch group names for fallback', groupFetchErr);
      }
    }
  }
  
  if (memberGroupMap.size === 0) {

  }
  


  // Get attendance records only for these members
  const memberIds = members.map((member: MemberRow) => member.id);
  
  const { data: records, error: recordsError } = await supabase
    .from('attendance_records')
    .select('status, organization_member_id')
    .in('organization_member_id', memberIds);

  if (recordsError) {
    attendanceLogger.error("Error fetching attendance records:", recordsError);
    return { success: false, data: [] };
  }

  // Aggregate attendance by group
  const groupsMap: Record<
    string,
    { group: string; present: number; late: number; absent: number; excused: number; others: number }
  > = {};

  // Initialize groups with 0 counts
  for (const [_, groupName] of memberGroupMap) {
    if (!groupsMap[groupName]) {
      groupsMap[groupName] = {
        group: groupName,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        others: 0
      };
    }
  }

  // Count attendance for each group
  (records || []).forEach((rec) => {
    const groupName = memberGroupMap.get(rec.organization_member_id) ?? "Unknown";
    
    if (!groupsMap[groupName]) {
      groupsMap[groupName] = {
        group: groupName,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        others: 0
      };
    }

    const status = rec.status;
    if (status === "present") groupsMap[groupName].present += 1;
    else if (status === "late") groupsMap[groupName].late += 1;
    else if (status === "absent") groupsMap[groupName].absent += 1;
    else if (status === "excused") groupsMap[groupName].excused += 1;
    else {
      // exclude explicit 'early_leave' status from Others aggregation if present
      if (status === "early_leave" || status === "go_home" || status === "go-home" || status === "gone_home") {
        // do not count into others (these are valid statuses but not tracked in this view)
      } else {
        groupsMap[groupName].others += 1;
      }
    }
  });

  const result = Object.values(groupsMap)
    .filter(g => g.group !== "Unknown") // Optional: remove Unknown group if you don't want to show it
    .map((g) => ({
      group: g.group,
      present: g.present,
      late: g.late,
      absent: g.absent,
      excused: g.excused,
      others: g.others,
      total: g.present + g.late + g.absent + g.excused + g.others,
    }));

  return { success: true, data: result };
};
