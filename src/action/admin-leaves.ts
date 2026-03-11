"use server";

/**
 * Admin Server Actions for Leave Management
 * Handles admin operations for leave management
 */

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ILeaveType } from "@/lib/leave/types";
import { logger } from "@/lib/logger";

// ============================================
// HELPER: Check Admin Permission
// ============================================

async function checkAdminPermission(organizationId: number) {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: "Unauthorized", hasPermission: false };
  }
  
  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select(`
      *,
      role:system_roles(*)
    `)
    .eq("user_id", user.id)
    .eq("organization_id", organizationId)
    .single();
  
  if (memberError || !member) {
    return { error: "Member not found", hasPermission: false };
  }
  
  // Role codes: A001 = Admin Org, SA001 = Super Admin
  const isAdmin = member.role?.code === 'A001' || member.role?.code === 'SA001';
  
  if (!isAdmin) {
    return { error: "Permission denied", hasPermission: false };
  }
  
  return { error: null, hasPermission: true, member };
}

// ============================================
// 1. GET LEAVE STATISTICS
// ============================================

export async function getLeaveStatistics(organizationId: number) {
  try {
    const permissionCheck = await checkAdminPermission(organizationId);
    if (!permissionCheck.hasPermission) {
      return {
        success: false,
        message: permissionCheck.error,
        data: null
      };
    }
    
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Get all requests
    const { data: allRequests, error: requestsError } = await supabase
      .from("leave_requests")
      .select(`
        *,
        organization_member:organization_members!inner(
          organization_id
        )
      `)
      .eq("organization_member.organization_id", organizationId);
    
    logger.debug("?? Query for organizationId:", organizationId);
    logger.debug("?? All requests found:", allRequests?.length || 0);
    
    if (requestsError) {
      logger.error("? Error fetching requests:", requestsError);
      throw requestsError;
    }
    
    // Get total members
    const { count: totalMembers } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_active", true);
    
    // Get employees currently on leave
    const { data: currentLeaves } = await supabase
      .from("leave_requests")
      .select(`
        organization_member_id,
        organization_member:organization_members!inner(
          organization_id
        )
      `)
      .eq("organization_member.organization_id", organizationId)
      .eq("status", "approved")
      .lte("start_date", today)
      .gte("end_date", today);
    
    // Get upcoming leaves
    const { data: upcomingLeaves } = await supabase
      .from("leave_requests")
      .select(`
        *,
        organization_member:organization_members!inner(
          organization_id
        )
      `)
      .eq("organization_member.organization_id", organizationId)
      .eq("status", "approved")
      .gt("start_date", today)
      .lte("start_date", thirtyDaysFromNow);
    
    // Calculate statistics
    const statistics = {
      totalRequests: allRequests?.length || 0,
      pendingRequests: allRequests?.filter(r => r.status === 'pending').length || 0,
      approvedRequests: allRequests?.filter(r => r.status === 'approved').length || 0,
      rejectedRequests: allRequests?.filter(r => r.status === 'rejected').length || 0,
      totalMembers: totalMembers || 0,
      membersOnLeave: new Set(currentLeaves?.map(l => l.organization_member_id)).size || 0,
      upcomingLeaves: upcomingLeaves?.length || 0,
      averageLeaveDays: allRequests?.length > 0 
        ? (allRequests.reduce((sum, r) => sum + (r.total_days || 0), 0) / allRequests.length).toFixed(1)
        : 0
    };
    
    return {
      success: true,
      message: "Statistics retrieved successfully",
      data: statistics
    };
  } catch (error) {
    logger.error("Error fetching leave statistics:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null
    };
  }
}

// ============================================
// 2. GET ALL LEAVE REQUESTS
// ============================================

export async function getAllLeaveRequests(organizationId: number) {
  try {
    const permissionCheck = await checkAdminPermission(organizationId);
    if (!permissionCheck.hasPermission) {
      return {
        success: false,
        message: permissionCheck.error,
        data: null
      };
    }
    
    const supabase = await createClient();
    
    const { data: requests, error } = await supabase
      .from("leave_requests")
      .select(`
        *,
        leave_type:leave_types(*),
        organization_member:organization_members!inner(
          *,
          user:user_profiles(id, employee_code, first_name, last_name, display_name, profile_photo_url),
          departments:department_id(id, code, name),
          positions:position_id(id, code, title),
          organization_id
        ),
        approvals:leave_approvals(
          id,
          approver_id,
          approval_level,
          status,
          comments,
          responded_at,
          approver:approver_id(id, first_name, last_name, display_name, profile_photo_url)
        ),
        approved_by_user:approved_by(id, first_name, last_name, display_name, profile_photo_url)
      `)
      .eq("organization_member.organization_id", organizationId)
      .order("requested_at", { ascending: false });
    
    logger.debug("?? getAllLeaveRequests for organizationId:", organizationId);
    logger.debug("?? Requests found:", requests?.length || 0);
    
    if (error) {
      logger.error("? Error fetching all requests:", error);
      throw error;
    }
    
    return {
      success: true,
      message: "Leave requests retrieved successfully",
      data: requests
    };
  } catch (error) {
    logger.error("Error fetching all leave requests:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null
    };
  }
}

// ============================================
// 3. GET ORGANIZATION LEAVE TYPES
// ============================================

export async function getOrganizationLeaveTypes(organizationId: number) {
  try {
    const permissionCheck = await checkAdminPermission(organizationId);
    if (!permissionCheck.hasPermission) {
      return {
        success: false,
        message: permissionCheck.error,
        data: null
      };
    }
    
    const supabase = await createClient();
    
    const { data: leaveTypes, error } = await supabase
      .from("leave_types")
      .select("*")
      .eq("organization_id", organizationId)
      .order("code", { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      message: "Leave types retrieved successfully",
      data: leaveTypes
    };
  } catch (error) {
    logger.error("Error fetching organization leave types:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null
    };
  }
}

// ============================================
// 4. CREATE LEAVE TYPE
// ============================================

export async function createLeaveType(organizationId: number, data: Partial<ILeaveType>) {
  try {
    const permissionCheck = await checkAdminPermission(organizationId);
    if (!permissionCheck.hasPermission) {
      return {
        success: false,
        message: permissionCheck.error,
        data: null
      };
    }
    
    const supabase = await createClient();
    
    // Check if code already exists
    const { data: existing } = await supabase
      .from("leave_types")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("code", data.code!)
      .single();
    
    if (existing) {
      return {
        success: false,
        message: "Leave type code already exists",
        data: null
      };
    }
    
    const { data: newType, error } = await supabase
      .from("leave_types")
      .insert({
        ...data,
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Create default balances for all active members
    const { data: members } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("is_active", true);
    
    if (members && members.length > 0 && newType.days_per_year > 0) {
      const currentYear = new Date().getFullYear();
      const balances = members.map(member => ({
        organization_member_id: member.id,
        leave_type_id: newType.id,
        year: currentYear,
        entitled_days: newType.days_per_year,
        carried_forward_days: 0,
        used_days: 0,
        pending_days: 0,
        remaining_days: newType.days_per_year
      }));
      
      await supabase.from("leave_balances").insert(balances);
    }
    
    revalidatePath("/leaves");
    
    return {
      success: true,
      message: "Leave type created successfully",
      data: newType
    };
  } catch (error) {
    logger.error("Error creating leave type:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null
    };
  }
}

// ============================================
// 5. UPDATE LEAVE TYPE
// ============================================

export async function updateLeaveType(
  organizationId: number,
  leaveTypeId: number,
  data: Partial<ILeaveType>
) {
  try {
    const permissionCheck = await checkAdminPermission(organizationId);
    if (!permissionCheck.hasPermission) {
      return {
        success: false,
        message: permissionCheck.error,
        data: null
      };
    }
    
    const supabase = await createClient();
    
    // Check if leave type belongs to organization
    const { data: existing } = await supabase
      .from("leave_types")
      .select("*")
      .eq("id", leaveTypeId)
      .eq("organization_id", organizationId)
      .single();
    
    if (!existing) {
      return {
        success: false,
        message: "Leave type not found",
        data: null
      };
    }
    
    const { data: updatedType, error } = await supabase
      .from("leave_types")
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq("id", leaveTypeId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Update balances if days_per_year changed
    if (data.days_per_year !== undefined && data.days_per_year !== existing.days_per_year) {
      const currentYear = new Date().getFullYear();
      
      await supabase.rpc("update_leave_balances_entitled", {
        p_leave_type_id: leaveTypeId,
        p_year: currentYear,
        p_new_entitled: data.days_per_year
      });
    }
    
    revalidatePath("/leaves");
    
    return {
      success: true,
      message: "Leave type updated successfully",
      data: updatedType
    };
  } catch (error) {
    logger.error("Error updating leave type:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null
    };
  }
}

// ============================================
// 6. DELETE LEAVE TYPE
// ============================================

export async function deleteLeaveType(organizationId: number, leaveTypeId: number) {
  try {
    const permissionCheck = await checkAdminPermission(organizationId);
    if (!permissionCheck.hasPermission) {
      return {
        success: false,
        message: permissionCheck.error,
        data: null
      };
    }
    
    const supabase = await createClient();
    
    // Check if there are any requests using this type
    const { count } = await supabase
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
      .eq("leave_type_id", leaveTypeId);
    
    if (count && count > 0) {
      return {
        success: false,
        message: "Cannot delete leave type with existing requests. Consider deactivating it instead.",
        data: null
      };
    }
    
    // Delete related balances first
    await supabase
      .from("leave_balances")
      .delete()
      .eq("leave_type_id", leaveTypeId);
    
    // Delete leave type
    const { error } = await supabase
      .from("leave_types")
      .delete()
      .eq("id", leaveTypeId)
      .eq("organization_id", organizationId);
    
    if (error) {
      throw error;
    }
    
    revalidatePath("/leaves");
    
    return {
      success: true,
      message: "Leave type deleted successfully",
      data: null
    };
  } catch (error) {
    logger.error("Error deleting leave type:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null
    };
  }
}

// ============================================
// 7. APPROVE LEAVE REQUEST
// ============================================

export async function approveLeaveRequest(
  organizationId: number,
  requestId: number,
  comments?: string
) {
  try {
    const permissionCheck = await checkAdminPermission(organizationId);
    if (!permissionCheck.hasPermission) {
      return {
        success: false,
        message: permissionCheck.error,
        data: null
      };
    }
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get request details
    const { data: request, error: requestError } = await supabase
      .from("leave_requests")
      .select(`
        *,
        leave_type:leave_types(*),
        organization_member:organization_members!inner(
          organization_id
        )
      `)
      .eq("id", requestId)
      .eq("organization_member.organization_id", organizationId)
      .single();
    
    if (requestError || !request) {
      return {
        success: false,
        message: "Leave request not found",
        data: null
      };
    }
    
    if (request.status !== 'pending') {
      return {
        success: false,
        message: "Can only approve pending requests",
        data: null
      };
    }
    
    // Create approval record first
    const { error: approvalError } = await supabase
      .from("leave_approvals")
      .insert({
        leave_request_id: requestId,
        approver_id: user?.id,
        approval_level: 1, // Default level
        status: 'approved',
        comments: comments || null,
        responded_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
    
    if (approvalError) {
      throw approvalError;
    }

    // Update request status
    const { error: updateError } = await supabase
      .from("leave_requests")
      .update({
        status: 'approved',
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
        approval_note: comments,
        updated_at: new Date().toISOString()
      })
      .eq("id", requestId);
    
    if (updateError) {
      throw updateError;
    }
    
    // Update leave balance
    if (request.leave_type && request.leave_type.days_per_year > 0) {
      const currentYear = new Date().getFullYear();
      
      // Move days from pending to used
      await supabase.rpc("approve_leave_balance", {
        p_member_id: request.organization_member_id,
        p_leave_type_id: request.leave_type_id,
        p_year: currentYear,
        p_days: request.total_days
      });
    }
    
    // TODO: Send notification to employee
    
    revalidatePath("/leaves");
    
    return {
      success: true,
      message: "Leave request approved successfully",
      data: null
    };
  } catch (error) {
    logger.error("Error approving leave request:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null
    };
  }
}

// ============================================
// 8. REJECT LEAVE REQUEST
// ============================================

export async function rejectLeaveRequest(
  organizationId: number,
  requestId: number,
  reason: string
) {
  try {
    const permissionCheck = await checkAdminPermission(organizationId);
    if (!permissionCheck.hasPermission) {
      return {
        success: false,
        message: permissionCheck.error,
        data: null
      };
    }
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get request details
    const { data: request, error: requestError } = await supabase
      .from("leave_requests")
      .select(`
        *,
        leave_type:leave_types(*),
        organization_member:organization_members!inner(
          organization_id
        )
      `)
      .eq("id", requestId)
      .eq("organization_member.organization_id", organizationId)
      .single();
    
    if (requestError || !request) {
      return {
        success: false,
        message: "Leave request not found",
        data: null
      };
    }
    
    if (request.status !== 'pending') {
      return {
        success: false,
        message: "Can only reject pending requests",
        data: null
      };
    }
    
    // Create approval record first
    const { error: approvalError } = await supabase
      .from("leave_approvals")
      .insert({
        leave_request_id: requestId,
        approver_id: user?.id,
        approval_level: 1, // Default level
        status: 'rejected',
        comments: reason || null,
        responded_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
    
    if (approvalError) {
      throw approvalError;
    }

    // Update request status
    const { error: updateError } = await supabase
      .from("leave_requests")
      .update({
        status: 'rejected',
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
        rejected_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq("id", requestId);
    
    if (updateError) {
      throw updateError;
    }
    
    // Restore pending days in balance
    if (request.leave_type && request.leave_type.days_per_year > 0) {
      const currentYear = new Date().getFullYear();
      
      await supabase.rpc("update_leave_balance_pending", {
        p_member_id: request.organization_member_id,
        p_leave_type_id: request.leave_type_id,
        p_year: currentYear,
        p_days: request.total_days,
        p_operation: "subtract"
      });
    }
    
    // TODO: Send notification to employee
    
    revalidatePath("/leaves");
    
    return {
      success: true,
      message: "Leave request rejected",
      data: null
    };
  } catch (error) {
    logger.error("Error rejecting leave request:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null
    };
  }
}
