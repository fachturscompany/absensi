/**
 * TypeScript Interfaces for Leave Management System
 */

import { IOrganization_member, IUser } from '@/interface';

// ============================================
// LEAVE TYPE
// ============================================

export interface ILeaveType {
  id: number;
  organization_id: number;
  code: string;
  name: string;
  description?: string;
  days_per_year: number;
  carry_forward_allowed: boolean;
  max_carry_forward_days?: number;
  requires_approval: boolean;
  requires_document: boolean;
  minimum_days_notice: number;
  color_code?: string;
  is_paid: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// LEAVE REQUEST
// ============================================

export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface ILeaveRequest {
  id: number;
  organization_member_id: number;
  leave_type_id: number;
  request_number: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  start_half_day: boolean;
  end_half_day: boolean;
  total_days: number;
  reason: string;
  emergency_contact?: string;
  status: LeaveRequestStatus;
  requested_at: string;
  approved_by?: string; // user_id
  approved_at?: string;
  approval_note?: string;
  rejected_reason?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  document_urls?: string[];
  created_at: string;
  updated_at: string;
  
  // Relations (populated)
  organization_member?: IOrganization_member;
  leave_type?: ILeaveType;
  approver?: IUser;
  approvals?: ILeaveApproval[];
  approved_by_user?: IUser; // Fallback: populated from approved_by field
}

// ============================================
// LEAVE BALANCE
// ============================================

export interface ILeaveBalance {
  id: number;
  organization_member_id: number;
  leave_type_id: number;
  year: number;
  entitled_days: number; // Total allocation
  carried_forward_days: number; // From previous year
  used_days: number; // Approved leaves
  pending_days: number; // Pending approval
  remaining_days: number; // Available balance
  created_at: string;
  updated_at: string;
  
  // Relations
  organization_member?: IOrganization_member;
  leave_type?: ILeaveType;
}

// ============================================
// LEAVE APPROVAL
// ============================================

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ILeaveApproval {
  id: number;
  leave_request_id: number;
  approver_id: string; // user_id
  approval_level: number;
  status: ApprovalStatus;
  decision?: 'approved' | 'rejected';
  decision_at?: string;
  comments?: string;
  responded_at?: string; // timestamptz - when approver responded
  delegated_from?: string; // user_id if delegated
  created_at: string;
  updated_at: string;
  
  // Relations
  leave_request?: ILeaveRequest;
  approver?: IUser;
}

// ============================================
// FORM DATA TYPES
// ============================================

export interface CreateLeaveRequestData {
  leave_type_id: number;
  start_date: string;
  end_date: string;
  start_half_day?: boolean;
  end_half_day?: boolean;
  reason: string;
  emergency_contact?: string;
  document_urls?: string[];
}

export interface ApproveLeaveData {
  request_id: number;
  approval_id: number;
  comments?: string;
}

export interface RejectLeaveData {
  request_id: number;
  approval_id: number;
  reason: string;
}

export interface CancelLeaveData {
  request_id: number;
  reason: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface LeaveRequestWithDetails extends ILeaveRequest {
  leave_type: ILeaveType;
  organization_member: IOrganization_member & {
    user: IUser;
  };
  approvals: ILeaveApproval[];
  current_approver?: IUser;
}

export interface LeaveBalanceWithType extends ILeaveBalance {
  leave_type: ILeaveType;
}

export interface LeaveSummary {
  total_allocated: number;
  total_used: number;
  total_pending: number;
  total_remaining: number;
  by_type: {
    leave_type: ILeaveType;
    balance: ILeaveBalance;
  }[];
}
