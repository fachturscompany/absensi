"use server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { IOrganization_member } from "@/interface";

import { memberLogger } from '@/lib/logger';

async function getSupabase() {
  return await createClient();
}

// ? Add MemIOrganization_member
export const createOrganizationMember = async (Organization_member: Partial<IOrganization_member>) => {
  const supabase = await getSupabase();
  const adminClient = createAdminClient();
  
  // Extract role_id if present
  const { role_id, ...memberData } = Organization_member;

  const { data, error } = await supabase.from("organization_members").insert([memberData]).select().single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  // If role_id was provided, assign it in the join table
  if (role_id && data.id) {
    await adminClient.from("organization_member_roles").insert({
      organization_member_id: data.id,
      role_id: role_id
    });
  }

  return { success: true, message: "Members added successfully", data: data as IOrganization_member };
};
export const getAllOrganization_member = async (organizationId?: number) => {
  const supabase = await getSupabase();
  const adminClient = createAdminClient();

  // 1. Retrieve user from cookies
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "User not logged in", data: [] };
  }

  // 2. Determine which organization to fetch
  let targetOrgId = organizationId;

  if (!targetOrgId) {
    // If no organizationId provided, get user's first organization
    const { data: memberships } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id);

    const member = memberships?.[0];

    if (!member) {
      return { success: true, message: "User not registered in any organization", data: [] };
    }
    targetOrgId = member.organization_id;
  }

  memberLogger.debug(`?? Fetching members for organization: ${targetOrgId}`);

  // 3. Fetch all members belonging to the organization
  // Note: Increase limit to 10000 to support large organizations
  // Fetch with explicit limit (Supabase max is 1000 per request by default)
  // We'll use multiple requests if needed
  let allData: any[] = [];
  let currentPage = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = currentPage * pageSize;
    const to = from + pageSize - 1;

    const { data: pageData, error: pageError } = await adminClient
      .from("organization_members")
      .select(`
      *,
      user:user_id (
        id,
        email,
        first_name,
        last_name,
        display_name,
        phone,
        mobile,
        date_of_birth,
        jenis_kelamin,
        nik,
        nisn,
        tempat_lahir,
        agama,
        jalan,
        rt,
        rw,
        dusun,
        kelurahan,
        kecamatan,
        profile_photo_url,
        search_name,
        is_active
      ),
      departments:department_id (
        id,
        name,
        code,
        organization_id
      ),
      positions:position_id (
        id,
        title,
        code
      ),
      organization_member_roles (
        id,
        role:system_roles (
          id,
          code,
          name,
          description
        )
      )
    `)
      .eq("organization_id", targetOrgId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .range(from, to);

    if (pageError) {
      memberLogger.error('? Error fetching page', currentPage, pageError);
      return { success: false, message: pageError.message, data: [] };
    }

    if (pageData && pageData.length > 0) {
      // Normalize roles and departments structure
      pageData.forEach((member: any) => {
        if (member.organization_member_roles) {
          const roles = member.organization_member_roles;
          if (Array.isArray(roles) && roles.length > 0) {
            // Backward compatibility: set singular role and role_id
            const roleData = roles[0].role;
            const normalizedRole = Array.isArray(roleData) ? roleData[0] : roleData;
            member.role = normalizedRole;
            member.role_id = normalizedRole?.id;
          }
        }

        if (member.departments) {
          // If departments is an array, take the first element
          if (Array.isArray(member.departments) && member.departments.length > 0) {
            member.departments = member.departments[0];
          }
          // If departments is null or empty array, set to null
          else if (Array.isArray(member.departments) && member.departments.length === 0) {
            member.departments = null;
          }
        }

        // Log untuk debugging
        if (member.department_id && !member.departments) {
          memberLogger.debug(`?? Member ${member.id} has department_id ${member.department_id} but no departments from join`);
        }
      });

      allData = allData.concat(pageData);
      memberLogger.debug(`?? Fetched page ${currentPage + 1}: ${pageData.length} records (total so far: ${allData.length})`);

      // If we got less than pageSize, we're done
      if (pageData.length < pageSize) {
        hasMore = false;
      } else {
        currentPage++;
      }
    } else {
      hasMore = false;
    }

    // Safety limit: stop after 20 pages (20,000 records)
    if (currentPage >= 20) {
      memberLogger.warn('?? Reached safety limit of 20 pages (20,000 records)');
      hasMore = false;
    }
  }

  const data = allData;

  // 4. Untuk member yang user_id null, ambil data dari biodata berdasarkan biodata_nik atau employee_id (NIK)
  // Dan juga perbaiki departments jika join gagal
  if (data && data.length > 0) {
    // Kumpulkan semua department_id yang perlu di-fetch (dari organization_members dan biodata)
    const deptIds = new Set<number>();
    let membersWithoutDept = 0;
    data.forEach((member: any) => {
      // Check if departments is null, undefined, empty array, or doesn't have name
      const hasValidDept = member.departments &&
        (typeof member.departments === 'object' && !Array.isArray(member.departments) && member.departments.name) ||
        (Array.isArray(member.departments) && member.departments.length > 0 && member.departments[0]?.name);

      if (member.department_id && !hasValidDept) {
        // Convert to number to ensure consistency
        const deptId = typeof member.department_id === 'string' ? parseInt(member.department_id, 10) : member.department_id;
        if (!isNaN(deptId)) {
          deptIds.add(deptId);
          membersWithoutDept++;
        } else {
          memberLogger.warn(`?? Invalid department_id for member ${member.id}:`, member.department_id);
        }
      }
    });

    memberLogger.debug(`?? Found ${membersWithoutDept} members without departments but with department_id`);
    memberLogger.debug(`?? Department IDs to fetch:`, Array.from(deptIds));

    // Fetch departments untuk semua member yang perlu (baik yang punya user_id maupun tidak)
    const departmentsMap = new Map();
    if (deptIds.size > 0) {
      const deptIdsArray = Array.from(deptIds);
      memberLogger.debug(`?? Fetching ${deptIdsArray.length} departments...`);
      const { data: deptList, error: deptError } = await adminClient
        .from("departments")
        .select("id, name, code, organization_id")
        .in("id", deptIdsArray);

      if (deptError) {
        memberLogger.error('? Error fetching departments:', deptError);
      } else if (deptList) {
        memberLogger.debug(`? Fetched ${deptList.length} departments:`, deptList.map((d: any) => `${d.id}:${d.name}`));
        deptList.forEach((dept: any) => {
          // Ensure id is number for consistent lookup
          const deptId = typeof dept.id === 'string' ? parseInt(dept.id, 10) : dept.id;
          if (!isNaN(deptId)) {
            departmentsMap.set(deptId, dept);
          }
        });
        memberLogger.debug(`?? Departments map keys:`, Array.from(departmentsMap.keys()));
      } else {
        memberLogger.warn('?? No departments returned from query');
      }
    }

    const membersWithoutUser = data.filter((m: any) => !m.user_id && (m.biodata_nik || m.employee_id));

    if (membersWithoutUser.length > 0) {
      const niks = membersWithoutUser.map((m: any) => m.biodata_nik || m.employee_id).filter(Boolean);

      if (niks.length > 0) {
        const { data: biodataList, error: biodataError } = await adminClient
          .from("biodata")
          .select("nik, nama, nickname, email, no_telepon, jenis_kelamin, agama, department_id")
          .in("nik", niks);

        if (!biodataError && biodataList) {
          // Merge biodata ke dalam member data
          const biodataMap = new Map(biodataList.map((b: any) => [b.nik, b]));

          // Tambahkan department_id dari biodata ke set dan fetch jika belum ada di map
          const newDeptIds = new Set<number>();
          biodataList.forEach((b: any) => {
            if (b.department_id) {
              const biodataDeptId = typeof b.department_id === 'string' ? parseInt(b.department_id, 10) : b.department_id;
              if (!isNaN(biodataDeptId) && !departmentsMap.has(biodataDeptId)) {
                newDeptIds.add(biodataDeptId);
              }
            }
          });

          // Fetch departments baru dari biodata jika ada
          if (newDeptIds.size > 0) {
            const newDeptIdsArray = Array.from(newDeptIds);
            memberLogger.debug(`?? Fetching ${newDeptIdsArray.length} additional departments from biodata:`, newDeptIdsArray);
            const { data: newDeptList, error: newDeptError } = await adminClient
              .from("departments")
              .select("id, name, code, organization_id")
              .in("id", newDeptIdsArray);

            if (newDeptError) {
              memberLogger.error('? Error fetching additional departments:', newDeptError);
            } else if (newDeptList) {
              memberLogger.debug(`? Fetched ${newDeptList.length} additional departments`);
              newDeptList.forEach((dept: any) => {
                const deptId = typeof dept.id === 'string' ? parseInt(dept.id, 10) : dept.id;
                if (!isNaN(deptId)) {
                  departmentsMap.set(deptId, dept);
                }
              });
            }
          }

          data.forEach((member: any) => {
            // Check if departments is valid
            const hasValidDept = member.departments &&
              (typeof member.departments === 'object' && !Array.isArray(member.departments) && member.departments.name) ||
              (Array.isArray(member.departments) && member.departments.length > 0 && member.departments[0]?.name);

            if (!member.user_id && (member.biodata_nik || member.employee_id)) {
              const nik = member.biodata_nik || member.employee_id;
              const biodata = biodataMap.get(nik);
              if (biodata) {
                // Buat object user dummy dari biodata untuk konsistensi dengan struktur yang ada
                member.user = {
                  id: null,
                  email: biodata.email || null,
                  first_name: biodata.nama?.split(" ")[0] || biodata.nama || null,
                  last_name: biodata.nama?.split(" ").slice(1).join(" ") || null,
                  display_name: biodata.nickname || biodata.nama || null,
                };
                // Update biodata relation jika belum ada
                if (!member.biodata) {
                  member.biodata = biodata;
                }

                // Jika member tidak punya departments tapi biodata punya department_id, ambil dari biodata
                if (!hasValidDept && biodata.department_id) {
                  const biodataDeptId = typeof biodata.department_id === 'string' ? parseInt(biodata.department_id, 10) : biodata.department_id;
                  if (!isNaN(biodataDeptId)) {
                    const dept = departmentsMap.get(biodataDeptId);
                    if (dept) {
                      member.departments = dept;
                      memberLogger.debug(`? Set departments from biodata for member ${member.id} (dept_id: ${biodataDeptId}):`, dept.name);
                    }
                  }
                }
              }
            }

            // Fallback: jika member punya department_id tapi tidak punya departments (join gagal)
            if (member.department_id && !hasValidDept) {
              const deptId = typeof member.department_id === 'string' ? parseInt(member.department_id, 10) : member.department_id;
              if (!isNaN(deptId)) {
                const dept = departmentsMap.get(deptId);
                if (dept) {
                  member.departments = dept;
                  memberLogger.debug(`? Set departments from department_id for member ${member.id} (dept_id: ${deptId}):`, dept.name);
                } else {
                  memberLogger.warn(`?? Department ID ${deptId} not found in departments map for member ${member.id}`);
                }
              }
            }
          });
        }
      }
    }

    // Setelah semua processing, pastikan semua member yang punya department_id punya departments
    // (menggunakan departmentsMap yang sudah di-fetch sebelumnya)
    let fixedCount = 0;
    data.forEach((member: any) => {
      // Check if departments is valid
      const hasValidDept = member.departments &&
        (typeof member.departments === 'object' && !Array.isArray(member.departments) && member.departments.name) ||
        (Array.isArray(member.departments) && member.departments.length > 0 && member.departments[0]?.name);

      if (member.department_id && !hasValidDept) {
        // Convert department_id to number if it's a string
        const deptId = typeof member.department_id === 'string' ? parseInt(member.department_id, 10) : member.department_id;

        if (!isNaN(deptId)) {
          const dept = departmentsMap.get(deptId);
          if (dept) {
            member.departments = dept;
            fixedCount++;
            memberLogger.debug(`? Set departments from department_id for member ${member.id} (dept_id: ${deptId}):`, dept.name);
          } else {
            memberLogger.warn(`?? Department ID ${deptId} (type: ${typeof member.department_id}) not found in departments map for member ${member.id} (biodata_nik: ${member.biodata_nik})`);
            memberLogger.warn(`?? Available department IDs in map:`, Array.from(departmentsMap.keys()));
          }
        } else {
          memberLogger.warn(`?? Invalid department_id for member ${member.id}:`, member.department_id);
        }
      }
    });

    memberLogger.info(`?? Fixed departments for ${fixedCount} members`);
  }

  memberLogger.info(`? Fetched ${data?.length || 0} members for organization ${targetOrgId}`);
  return { success: true, data: data as IOrganization_member[] };
};

type OrganizationSummary = {
  organizationId: string | null;
  stats: {
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    pendingInvitations: number;
  };
};

export const getMemberSummary = async (): Promise<OrganizationSummary> => {
  const supabase = await getSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      organizationId: null,
      stats: { totalMembers: 0, activeMembers: 0, inactiveMembers: 0, pendingInvitations: 0 },
    };
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id);

  const membership = memberships?.[0];

  if (membershipError || !membership?.organization_id) {
    return {
      organizationId: null,
      stats: { totalMembers: 0, activeMembers: 0, inactiveMembers: 0, pendingInvitations: 0 },
    };
  }

  const organizationId = membership.organization_id as string;

  const [totalMembersRes, activeMembersRes, pendingInvitesRes] = await Promise.all([
    supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_active", true),
    supabase
      .from("member_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending"),
  ]);

  const totalMembers = totalMembersRes.count ?? 0;
  const activeMembers = activeMembersRes.count ?? 0;
  const inactiveMembers = totalMembers - activeMembers;
  const pendingInvitations = pendingInvitesRes.count ?? 0;

  return {
    organizationId,
    stats: {
      totalMembers,
      activeMembers,
      inactiveMembers,
      pendingInvitations,
    },
  };
};

// ?? Update Organization
export const updateOrganizationMember = async (id: string, organization: Partial<IOrganization_member>) => {
  const supabase = await getSupabase();
  const adminClient = createAdminClient();

  // Extract role_id if present
  const { role_id, ...memberData } = organization;

  const { data, error } = await supabase
    .from("organization_members")
    .update(memberData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  // If role_id was provided, update the join table
  if (role_id) {
    // 1. Delete existing roles
    await adminClient
      .from("organization_member_roles")
      .delete()
      .eq("organization_member_id", id);
      
    // 2. Insert new role
    await adminClient
      .from("organization_member_roles")
      .insert({
        organization_member_id: id,
        role_id: role_id
      });
  }

  return { success: true, message: "Organization updated successfully", data: data as IOrganization_member };
};
export const deleteOrganization_member = async (id: string) => {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Organization Members deleted successfully", data: data as IOrganization_member };
};


export const getOrganizationMembersById = async (id: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("organization_members")
    .select(`
    *,
    organizations:organization_id (*),
    organization_member_roles (
      id,
      role:system_roles (
        id,
        code,
        name,
        description
      )
    )
  `)
    .eq("id", id)
    .single()

  if (error) {
    return { success: false, message: error.message, data: null }
  }

  // If the member row exists, also fetch related user, department and position records
  try {

    const member: any = data

    if (member) {
      // Fetch user profile
      if (member.user_id) {
        // select common profile fields including email explicitly
        const { data: userData, error: userError } = await supabase
          .from("user_profiles")
          .select("id, employee_code, nik, first_name, last_name, display_name, phone, mobile, date_of_birth, profile_photo_url, email, is_active, created_at, updated_at, deleted_at, jalan, rt, rw, dusun, kelurahan, kecamatan")
          .eq("id", member.user_id)
          .maybeSingle()

        if (!userError && userData) member.user = userData
      }

      // Fetch department (group)
      if (member.department_id) {
        const { data: deptData, error: deptError } = await supabase
          .from("departments")
          .select("*")
          .eq("id", member.department_id)
          .maybeSingle()

        if (!deptError && deptData) member.departments = deptData
      }

      // Fetch position
      if (member.position_id) {
        const { data: posData, error: posError } = await supabase
          .from("positions")
          .select("*")
          .eq("id", member.position_id)
          .maybeSingle()

        if (!posError && posData) member.positions = posData
      }

      if (!member.organization && member.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", member.organization_id)
          .maybeSingle()

        if (!orgError && orgData) member.organization = orgData
      }

      if (member.organization_member_roles) {
        const roles = member.organization_member_roles;
        if (Array.isArray(roles) && roles.length > 0) {
          const roleData = roles[0].role;
          const normalizedRole = Array.isArray(roleData) ? roleData[0] : roleData;
          member.role = normalizedRole;
          member.role_id = normalizedRole?.id;
        }
      }

      // Fetch RFID Card explicitly to be robust
      const memberId = !isNaN(Number(member.id)) ? Number(member.id) : member.id;
      const { data: rfidData, error: rfidError } = await supabase
        .from("rfid_cards")
        .select("*")
        .eq("organization_member_id", memberId)
        .maybeSingle()

      if (!rfidError && rfidData) {
        member.rfid_cards = rfidData
      }
    }
  } catch (e) {
    memberLogger.warn('getOrganizationMembersById: failed to fetch related records', e)
  }

  return { success: true, data }
}

export const getDepartmentMembersByOrganization = async (organizationId: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("departments")
    .select(
      `
      id,
      name,
      organization_members:organization_members!department_id (id)
      `
    )
    .eq("organization_id", organizationId);

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  const result = (data || []).map((dept) => ({
    department: dept.name,
    members: dept.organization_members ? dept.organization_members.length : 0,
  }));

  return { success: true, data: result };
};


export const getUserOrganizationId = async (userId: string) => {
  const supabase = await getSupabase();
  const { data: memberships, error: error } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId);

  const data = memberships?.[0];

  if (error) {
    return { success: false, message: error.message, organizationId: null };
  }

  if (!data) {
    // user is not yet registered in organization_members
    return { success: true, message: "User not in organization", organizationId: null };
  }

  return { success: true, message: "Organization found", organizationId: data.organization_id };
};

export const getMembersByGroupId = async (groupId: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      *,
      user:user_id (
        id,
        email,
        first_name,
        last_name,
        display_name
      )
    `)
    .eq("department_id", groupId);

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IOrganization_member[] };
};

export const getMembersByPositionId = async (positionId: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      *,
      user:user_id (
        id,
        email,
        first_name,
        last_name,
        display_name
      )
    `)
    .eq("position_id", positionId);

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IOrganization_member[] };
};

export const moveMembersToGroup = async (memberIds: string[], targetGroupId: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("organization_members")
    .update({ department_id: targetGroupId })
    .in("id", memberIds)
    .select();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, message: "Members moved successfully", data };
};

export const getOrganizationMembersPaginated = async ({
  page = 1,
  pageSize = 10,
  query = "",
  organizationId,
}: {
  page?: number;
  pageSize?: number;
  query?: string;
  organizationId?: string;
}) => {
  const supabase = await getSupabase();
  const adminClient = createAdminClient();

  // 1. Get user and organization if not provided
  let targetOrgId = organizationId;

  if (!targetOrgId) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "User not logged in", data: [], metadata: { total: 0, page, pageSize, totalPages: 0 } };
    }

    const { data: memberships } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id);

    const member = memberships?.[0];

    if (!member) {
      return { success: false, message: "User not registered in any organization", data: [], metadata: { total: 0, page, pageSize, totalPages: 0 } };
    }
    targetOrgId = member.organization_id.toString();
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let queryBuilder = adminClient
    .from("organization_members")
    .select(`
      id,
      biodata_nik,
      employee_id,
      user:user_id!inner (
        first_name,
        last_name,
        display_name,
        phone,
        mobile,
        gender,
        jenis_kelamin
      )
    `, { count: "exact" })
    .eq("organization_id", targetOrgId)
    .eq("is_active", true);

  if (query) {
    queryBuilder = queryBuilder.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,display_name.ilike.%${query}%`, { foreignTable: "user" });
  } else {
    queryBuilder = adminClient
      .from("organization_members")
      .select(`
          id,
          biodata_nik,
          employee_id,
          user:user_id (
            first_name,
            last_name,
            display_name,
            phone,
            mobile,
            gender,
            jenis_kelamin
          )
        `, { count: "exact" })
      .eq("organization_id", targetOrgId)
      .eq("is_active", true);
  }

  const { data, error, count } = await queryBuilder
    .range(from, to)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching members:", error);
    return { success: false, message: error.message, data: [], metadata: { total: 0, page, pageSize, totalPages: 0 } };
  }

  // Manually fetch biodata for members with no user but having NIK
  let finalData: any[] = data || [];

  if (finalData.length > 0) {
    const membersWithoutUser = finalData.filter((m: any) => !m.user && (m.biodata_nik || m.employee_id));

    if (membersWithoutUser.length > 0) {
      const niks = membersWithoutUser.map((m: any) => m.biodata_nik || m.employee_id).filter(Boolean);

      if (niks.length > 0) {
        const { data: biodataList } = await adminClient
          .from("biodata")
          .select("nik, nama")
          .in("nik", niks);

        if (biodataList) {
          const biodataMap = new Map(biodataList.map((b: any) => [b.nik, b]));

          finalData = finalData.map(member => {
            if (!member.user && (member.biodata_nik || member.employee_id)) {
              const nik = member.biodata_nik || member.employee_id;
              const biodata = biodataMap.get(nik);
              if (biodata) {
                member.biodata = biodata;
              }
            }
            return member;
          });
        }
      }
    }
  }

  const mappedMembers = finalData.map((m: any) => ({
    id: String(m.id),
    name: m.user
      ? `${m.user.first_name || ''} ${m.user.last_name || ''}`.trim() || m.user.display_name
      : (m.biodata?.nama || "Unknown Member")
  }));

  return {
    success: true,
    data: mappedMembers,
    metadata: {
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  };
};

export const getAllOrganizationMemberIds = async ({
  query = "",
  organizationId,
}: {
  query?: string;
  organizationId?: string;
}) => {
  const supabase = await getSupabase();
  const adminClient = createAdminClient();

  // 1. Get user and organization if not provided
  let targetOrgId = organizationId;

  if (!targetOrgId) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "User not logged in", data: [] };
    }

    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) {
      return { success: false, message: "User not registered in any organization", data: [] };
    }
    targetOrgId = member.organization_id.toString();
  }

  let allIds: string[] = [];
  let currentPage = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = currentPage * pageSize;
    const to = from + pageSize - 1;

    // Clone the query builder if needed, but here we just need to add range
    // Note: queryBuilder is modified in place, so we need to be careful.
    // However, if we define queryBuilder specific to the loop or just use range.

    // Better to reconstruct query each time or use existing if it supports re-execution with range.
    // Supabase query builders are immutable-ish until executed? 
    // Actually, calling .range() returns a new builder usually.
    // Let's safe bet: reconstruct or use a base builder.

    let pageQuery;

    if (query) {
      pageQuery = adminClient
        .from("organization_members")
        .select(`
          id,
          user:user_id!inner (
            first_name,
            last_name,
            display_name
          )
        `)
        .eq("organization_id", targetOrgId)
        .eq("is_active", true)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,display_name.ilike.%${query}%`, { foreignTable: "user" });
    } else {
      pageQuery = adminClient
        .from("organization_members")
        .select(`id`)
        .eq("organization_id", targetOrgId)
        .eq("is_active", true);
    }

    const { data, error } = await pageQuery
      .range(from, to)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching member IDs page", currentPage, error);
      // specific error handling? return partial?
      return { success: false, message: error.message, data: [] };
    }

    if (data && data.length > 0) {
      const ids = data.map((m: any) => String(m.id));
      allIds = allIds.concat(ids);

      if (data.length < pageSize) {
        hasMore = false;
      } else {
        currentPage++;
      }
    } else {
      hasMore = false;
    }

    // Safety break to prevent infinite loops if something goes wrong
    if (currentPage > 50) { // 50 * 1000 = 50,000 members
      console.warn("getAllOrganizationMemberIds reached safety limit of 50 pages");
      hasMore = false;
    }
  }

  return {
    success: true,
    data: allIds
  };
};

export const updateMemberInfo = async (
  memberId: string | number,
  userId: string,
  data: {
    // organization_members fields
    employee_id?: string;
    work_location?: string;
    hire_date?: string;
    // user_profiles fields
    first_name?: string;
    last_name?: string;
    display_name?: string;
    phone?: string;
    mobile?: string;
    date_of_birth?: string;
  }
) => {
  const adminClient = createAdminClient();

  try {
    const { 
      employee_id, work_location, hire_date,
      ...profileData 
    } = data;

    // 1. Update organization_members
    const memberUpdate: any = {};
    if (employee_id !== undefined) memberUpdate.employee_id = employee_id;
    if (work_location !== undefined) memberUpdate.work_location = work_location;
    if (hire_date !== undefined) memberUpdate.hire_date = hire_date;

    if (Object.keys(memberUpdate).length > 0) {
      const { error: memberError } = await adminClient
        .from("organization_members")
        .update(memberUpdate)
        .eq("id", memberId);

      if (memberError) throw memberError;
    }

    // 2. Update user_profiles
    if (Object.keys(profileData).length > 0) {
      const { error: profileError } = await adminClient
        .from("user_profiles")
        .update(profileData)
        .eq("id", userId);

      if (profileError) throw profileError;
    }

    return { success: true, message: "Member information updated successfully" };
  } catch (error: any) {
    memberLogger.error("updateMemberInfo error:", error);
    return { success: false, message: error.message || "Failed to update member information" };
  }
};
