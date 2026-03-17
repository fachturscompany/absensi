"use server";

/**
 * Server Actions for Leave Management System
 * Handles leave requests, approvals, and balance management
 */

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { 
  CreateLeaveRequestData,
  CancelLeaveData,
} from "@/lib/leave/types";
import { 
  calculateTotalLeaveDays, 
  generateRequestNumber,
  meetsNoticeRequirement,
  hasSufficientBalance
} from "@/lib/leave/utils";
// import { getLeaveConfigByIndustry } from "@/lib/leave/leave-configs";

import { logger } from '@/lib/logger';
// ============================================
// HELPER: Get Current Organization Member
// ============================================

async function getCurrentOrganizationMember() {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: "Unauthorized", data: null };
  }
  
  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select(`
      *,
      organization:organizations(*),
      user:user_profiles(*)
    `)
    .eq("user_id", user.id)
    .single();
  
  if (memberError || !member) {
    return { error: "Member not found", data: null };
  }
  
  return { error: null, data: member };
}

// ============================================
// 1. GET LEAVE TYPES
// ============================================

export async function getLeaveTypes() {
  try {
    const supabase = await createClient();
    const memberResult = await getCurrentOrganizationMember();
    
    if (memberResult.error || !memberResult.data) {
      return {
        success: false,
        message: memberResult.error,
        data: null
      };
    }
    
    const { data: leaveTypes, error } = await supabase
      .from("leave_types")
      .select("*")
      .eq("organization_id", memberResult.data.organization_id)
      .eq("is_active", true)
      .order("code", { ascending: true });
    
    if (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
    
    return {
      success: true,
      message: "Leave types retrieved successfully",
      data: leaveTypes
    };
  } catch (error) {
    logger.error("Error fetching leave types:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null
    };
  }
}

// ============================================
// 2. GET LEAVE BALANCE
// ============================================

export async function getMyLeaveBalance(year?: number) {
  try {
    const supabase = await createClient();
    const memberResult = await getCurrentOrganizationMember();
    
    if (memberResult.error || !memberResult.data) {
      return {
        success: false,
        message: memberResult.error,
        data: null
      };
    }
    
    const currentYear = year || new Date().getFullYear();
    
    const { data: balances, error } = await supabase
      .from("leave_balances")
      .select(`
        *,
        leave_type:leave_types(*)
      `)
      .eq("organization_member_id", memberResult.data.id)
      .eq("year", currentYear);
    
    if (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
    
    return {
      success: true,
      message: "Leave balance retrieved successfully",
      data: balances
    };
  } catch (error) {
    logger.error("Error fetching leave balance:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null
    };
  }
}

// ============================================
// 3. CREATE LEAVE REQUEST
// ============================================

export async function createLeaveRequest(data: CreateLeaveRequestData) {
  try {
    const supabase = await createClient();
    const memberResult = await getCurrentOrganizationMember();
    
    if (memberResult.error || !memberResult.data) {
      return {
        success: false,
        message: memberResult.error,
        data: null
      };
    }
    
    const member = memberResult.data;
    
    // Get leave type
    const { data: leaveType, error: leaveTypeError } = await supabase
      .from("leave_types")
      .select("*")
      .eq("id", data.leave_type_id)
      .single();
    
    if (leaveTypeError || !leaveType) {
      return {
        success: false,
        message: "Leave type not found",
        data: null
      };
    }
    
    // Calculate total days
    const totalDays = calculateTotalLeaveDays(
      data.start_date,
      data.end_date,
      data.start_half_day,
      data.end_half_day
    );
    
    if (totalDays <= 0) {
      return {
        success: false,
        message: "Invalid date range",
        data: null
      };
    }
    
    // Get organization config (available for future use)
    // const config = getLeaveConfigByIndustry(member.organization?.industry);
    
    // Validate minimum notice
    const noticeCheck = meetsNoticeRequirement(
      data.start_date,
      leaveType.minimum_days_notice
    );
    
    if (!noticeCheck.valid && leaveType.minimum_days_notice > 0) {
      return {
        success: false,
        message: `Requires ${leaveType.minimum_days_notice} days advance notice. You have ${noticeCheck.daysUntil} days.`,
        data: null
      };
    }
    
    // Check for overlapping leaves
    const { data: existingLeaves } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("organization_member_id", member.id)
      .in("status", ["pending", "approved"])
      .gte("end_date", data.start_date)
      .lte("start_date", data.end_date);
    
    if (existingLeaves && existingLeaves.length > 0) {
      return {
        success: false,
        message: "You have overlapping leave requests",
        data: null
      };
    }
    
    // Check balance (if not unlimited)
    if (leaveType.days_per_year > 0) {
      const currentYear = new Date().getFullYear();
      const { data: balance } = await supabase
        .from("leave_balances")
        .select("*")
        .eq("organization_member_id", member.id)
        .eq("leave_type_id", leaveType.id)
        .eq("year", currentYear)
        .single();
      
      if (balance && !hasSufficientBalance(totalDays, balance.remaining_days)) {
        return {
          success: false,
          message: `Insufficient balance. You have ${balance.remaining_days} days remaining.`,
          data: null
        };
      }
    }
    
    // Generate request number
    const { count } = await supabase
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
      .eq("organization_member_id", member.id);
    
    const requestNumber = generateRequestNumber(member.organization_id, (count || 0) + 1);
    
    // Create leave request
    const { data: newRequest, error: createError } = await supabase
      .from("leave_requests")
      .insert({
        organization_member_id: member.id,
        leave_type_id: data.leave_type_id,
        request_number: requestNumber,
        start_date: data.start_date,
        end_date: data.end_date,
        start_half_day: data.start_half_day || false,
        end_half_day: data.end_half_day || false,
        total_days: totalDays,
        reason: data.reason,
        emergency_contact: data.emergency_contact,
        document_urls: data.document_urls || [],
        status: "pending",
        requested_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      return {
        success: false,
        message: createError.message,
        data: null
      };
    }
    
    // Update pending days in balance
    if (leaveType.days_per_year > 0) {
      const currentYear = new Date().getFullYear();
      await supabase.rpc("update_leave_balance_pending", {
        p_member_id: member.id,
        p_leave_type_id: leaveType.id,
        p_year: currentYear,
        p_days: totalDays,
        p_operation: "add"
      });
    }
    
    // TODO: Create approval records
    // TODO: Send notifications to approvers
    
    revalidatePath("/leaves");
    
    return {
      success: true,
      message: "Leave request created successfully",
      data: newRequest
    };
  } catch (error) {
    logger.error("Error creating leave request:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null
    };
  }
}

// ============================================
// 4. GET MY LEAVE REQUESTS
// ============================================

export async function getMyLeaveRequests(status?: string) {
  try {
    const supabase = await createClient();
    const memberResult = await getCurrentOrganizationMember();
    
    if (memberResult.error || !memberResult.data) {
      return {
        success: false,
        message: memberResult.error,
        data: null
      };
    }
    
    let query = supabase
      .from("leave_requests")
      .select(`
        *,
        leave_type:leave_types(*),
        organization_member:organization_members(
          *,
          user:user_profiles(*)
        )
      `)
      .eq("organization_member_id", memberResult.data.id)
      .order("requested_at", { ascending: false });
    
    if (status) {
      query = query.eq("status", status);
    }
    
    const { data: requests, error } = await query;
    
    if (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
    
    return {
      success: true,
      message: "Leave requests retrieved successfully",
      data: requests
    };
  } catch (error) {
    logger.error("Error fetching leave requests:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null
    };
  }
}

// ============================================
// 5. CANCEL LEAVE REQUEST
// ============================================

export async function cancelLeaveRequest(data: CancelLeaveData) {
  try {
    const supabase = await createClient();
    const memberResult = await getCurrentOrganizationMember();
    
    if (memberResult.error || !memberResult.data) {
      return {
        success: false,
        message: memberResult.error,
        data: null
      };
    }
    
    // Get request
    const { data: request, error: requestError } = await supabase
      .from("leave_requests")
      .select(`
        *,
        leave_type:leave_types(*)
      `)
      .eq("id", data.request_id)
      .eq("organization_member_id", memberResult.data.id)
      .single();
    
    if (requestError || !request) {
      return {
        success: false,
        message: "Leave request not found",
        data: null
      };
    }
    
    if (request.status !== "pending") {
      return {
        success: false,
        message: "Can only cancel pending requests",
        data: null
      };
    }
    
    // Update request
    const { error: updateError } = await supabase
      .from("leave_requests")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: data.reason,
        updated_at: new Date().toISOString()
      })
      .eq("id", data.request_id);
    
    if (updateError) {
      return {
        success: false,
        message: updateError.message,
        data: null
      };
    }
    
    // Restore pending days in balance
    if (request.leave_type && request.leave_type.days_per_year > 0) {
      const currentYear = new Date().getFullYear();
      await supabase.rpc("update_leave_balance_pending", {
        p_member_id: memberResult.data.id,
        p_leave_type_id: request.leave_type_id,
        p_year: currentYear,
        p_days: request.total_days,
        p_operation: "subtract"
      });
    }
    
    revalidatePath("/leaves");
    
    return {
      success: true,
      message: "Leave request cancelled successfully",
      data: null
    };
  } catch (error) {
    logger.error("Error cancelling leave request:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null
    };
  }
}

// ============================================
// 6. GET LEAVE REQUEST DETAIL
// ============================================

export async function getLeaveRequestDetail(requestId: number) {
  try {
    const supabase = await createClient();
    
    const { data: request, error } = await supabase
      .from("leave_requests")
      .select(`
        *,
        leave_type:leave_types(*),
        organization_member:organization_members(
          *,
          user:user_profiles(*),
          departments:department_id(id, code, name),
          positions:position_id(id, code, title)
        ),
        approvals:leave_approvals(
          *,
          approver:user_profiles(*)
        )
      `)
      .eq("id", requestId)
      .single();
    
    if (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
    
    return {
      success: true,
      message: "Leave request detail retrieved successfully",
      data: request
    };
  } catch (error) {
    logger.error("Error fetching leave request detail:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null
    };
  }
}
