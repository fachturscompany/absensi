/**
 * Leave Configuration per Organization Type
 * Defines default leave types, labels, approval flow, and rules
 */

import { OrganizationType } from './organization-type-detector';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface LeaveTypeTemplate {
  code: string;
  name: string;
  description?: string;
  days_per_year: number;
  color_code: string;
  is_paid: boolean;
  carry_forward_allowed: boolean;
  max_carry_forward_days?: number;
  requires_approval: boolean;
  requires_document: boolean;
  minimum_days_notice: number;
  
  // Special rules
  auto_approve_under_days?: number;
  max_consecutive_days?: number;
  gender_specific?: 'male' | 'female';
  min_employment_years?: number;
  every_n_years?: number; // For Cuti Besar (every 6 years)
}

export interface ApprovalLevelConfig {
  level: number;
  title: string;
  required: boolean;
  required_if_days_gt?: number; // Only required if request > X days
  required_if_days_gte?: number;
}

export interface OrganizationLeaveConfig {
  // Labels & Terminology
  labels: {
    member: string;
    leave: string;
    manager: string;
    approver: string;
    department: string;
  };
  
  // Default Leave Types
  default_leave_types: LeaveTypeTemplate[];
  
  // Approval Workflow
  approval_levels: ApprovalLevelConfig[];
  
  // Business Rules
  rules: {
    min_days_notice: number;
    max_consecutive_days?: number;
    allow_half_day: boolean;
    working_days: number[]; // [1,2,3,4,5] = Mon-Fri
    accrual_method: 'monthly' | 'annual' | 'academic_year';
    
    // Type-specific rules
    subordinate_limit?: number; // Government: max 2 subordinates on leave
    requires_bkd_approval_days?: number; // Government: > 10 days
    requires_substitute?: boolean; // Education: needs substitute teacher
    block_during_exams?: boolean; // Education: cannot during exam periods
  };
}

// ============================================
// CORPORATE CONFIGURATION
// ============================================

const CORPORATE_CONFIG: OrganizationLeaveConfig = {
  labels: {
    member: 'Employee',
    leave: 'Leave',
    manager: 'Manager',
    approver: 'Supervisor',
    department: 'Department'
  },
  
  default_leave_types: [
    {
      code: 'ANNUAL',
      name: 'Annual Leave',
      description: 'Paid annual leave for rest and recreation',
      days_per_year: 12,
      color_code: '#10B981', // Green
      is_paid: true,
      carry_forward_allowed: true,
      max_carry_forward_days: 5,
      requires_approval: true,
      requires_document: false,
      minimum_days_notice: 3,
      max_consecutive_days: 10
    },
    {
      code: 'SICK',
      name: 'Sick Leave',
      description: 'Leave for medical reasons',
      days_per_year: 10,
      color_code: '#F59E0B', // Orange
      is_paid: true,
      carry_forward_allowed: false,
      requires_approval: true,
      requires_document: true, // Medical certificate if > 2 days
      minimum_days_notice: 0, // Emergency
      auto_approve_under_days: 2
    },
    {
      code: 'UNPAID',
      name: 'Unpaid Leave',
      description: 'Leave without pay',
      days_per_year: 0, // Unlimited
      color_code: '#6B7280', // Gray
      is_paid: false,
      carry_forward_allowed: false,
      requires_approval: true,
      requires_document: false,
      minimum_days_notice: 7
    },
    {
      code: 'MARRIAGE',
      name: 'Marriage Leave',
      description: 'Leave for employee marriage',
      days_per_year: 3,
      color_code: '#EC4899', // Pink
      is_paid: true,
      carry_forward_allowed: false,
      requires_approval: true,
      requires_document: true, // Marriage certificate
      minimum_days_notice: 14
    }
  ],
  
  approval_levels: [
    {
      level: 1,
      title: 'Direct Manager',
      required: true
    },
    {
      level: 2,
      title: 'Department Head',
      required: false,
      required_if_days_gt: 5
    },
    {
      level: 3,
      title: 'HR Manager',
      required: false,
      required_if_days_gt: 10
    }
  ],
  
  rules: {
    min_days_notice: 3,
    max_consecutive_days: 10,
    allow_half_day: true,
    working_days: [1, 2, 3, 4, 5], // Monday to Friday
    accrual_method: 'monthly' // 1 day per month
  }
};

// ============================================
// GOVERNMENT CONFIGURATION (PP 11/2017)
// ============================================

const GOVERNMENT_CONFIG: OrganizationLeaveConfig = {
  labels: {
    member: 'ASN/PNS',
    leave: 'Cuti',
    manager: 'Atasan Langsung',
    approver: 'Pejabat Berwenang',
    department: 'Dinas/Instansi'
  },
  
  default_leave_types: [
    {
      code: 'TAHUNAN',
      name: 'Cuti Tahunan',
      description: 'Cuti tahunan sesuai PP 11/2017',
      days_per_year: 12,
      color_code: '#10B981', // Green
      is_paid: true,
      carry_forward_allowed: true,
      max_carry_forward_days: 6, // Can accumulate for Cuti Besar
      requires_approval: true,
      requires_document: false,
      minimum_days_notice: 7
    },
    {
      code: 'SAKIT',
      name: 'Cuti Sakit',
      description: 'Cuti karena sakit dengan surat dokter',
      days_per_year: 0, // Unlimited with medical certificate
      color_code: '#F59E0B', // Orange
      is_paid: true,
      carry_forward_allowed: false,
      requires_approval: true,
      requires_document: true,
      minimum_days_notice: 0 // Emergency
    },
    {
      code: 'BESAR',
      name: 'Cuti Besar',
      description: 'Cuti besar untuk PNS yang telah bekerja 6 tahun berturut-turut',
      days_per_year: 90, // 3 months
      color_code: '#8B5CF6', // Purple
      is_paid: true,
      carry_forward_allowed: false,
      requires_approval: true,
      requires_document: false,
      minimum_days_notice: 30,
      min_employment_years: 6,
      every_n_years: 6
    },
    {
      code: 'MELAHIRKAN',
      name: 'Cuti Melahirkan',
      description: 'Cuti melahirkan untuk PNS perempuan',
      days_per_year: 90, // 3 months
      color_code: '#EC4899', // Pink
      is_paid: true,
      carry_forward_allowed: false,
      requires_approval: true,
      requires_document: true,
      minimum_days_notice: 30,
      gender_specific: 'female'
    },
    {
      code: 'ALASAN_PENTING',
      name: 'Cuti Alasan Penting',
      description: 'Cuti untuk keperluan penting yang mendesak',
      days_per_year: 0, // Case by case
      color_code: '#EF4444', // Red
      is_paid: true,
      carry_forward_allowed: false,
      requires_approval: true,
      requires_document: true,
      minimum_days_notice: 0
    }
  ],
  
  approval_levels: [
    {
      level: 1,
      title: 'Atasan Langsung',
      required: true
    },
    {
      level: 2,
      title: 'Kepala Dinas/Instansi',
      required: true
    },
    {
      level: 3,
      title: 'BKD/BKN',
      required: false,
      required_if_days_gt: 10
    }
  ],
  
  rules: {
    min_days_notice: 7,
    allow_half_day: false, // Government typically doesn't allow half-day
    working_days: [1, 2, 3, 4, 5],
    accrual_method: 'annual', // Full allocation on Jan 1
    subordinate_limit: 2, // Max 2 subordinates can be on leave simultaneously
    requires_bkd_approval_days: 10
  }
};

// ============================================
// EDUCATION CONFIGURATION
// ============================================

const EDUCATION_CONFIG: OrganizationLeaveConfig = {
  labels: {
    member: 'Teacher/Staff',
    leave: 'Leave',
    manager: 'Subject Coordinator',
    approver: 'Principal',
    department: 'Subject/Department'
  },
  
  default_leave_types: [
    {
      code: 'ANNUAL',
      name: 'Annual Leave',
      description: 'Annual leave during academic year',
      days_per_year: 12,
      color_code: '#10B981', // Green
      is_paid: true,
      carry_forward_allowed: true,
      max_carry_forward_days: 5,
      requires_approval: true,
      requires_document: false,
      minimum_days_notice: 5
    },
    {
      code: 'SICK',
      name: 'Sick Leave',
      description: 'Medical leave with certificate',
      days_per_year: 10,
      color_code: '#F59E0B', // Orange
      is_paid: true,
      carry_forward_allowed: false,
      requires_approval: true,
      requires_document: true,
      minimum_days_notice: 0,
      auto_approve_under_days: 1
    },
    {
      code: 'STUDY',
      name: 'Professional Development Leave',
      description: 'Leave for training, conferences, workshops',
      days_per_year: 5,
      color_code: '#3B82F6', // Blue
      is_paid: true,
      carry_forward_allowed: false,
      requires_approval: true,
      requires_document: true, // Training invitation/certificate
      minimum_days_notice: 14
    },
    {
      code: 'RELIGIOUS',
      name: 'Religious Leave',
      description: 'Leave for religious obligations',
      days_per_year: 2,
      color_code: '#8B5CF6', // Purple
      is_paid: true,
      carry_forward_allowed: false,
      requires_approval: true,
      requires_document: false,
      minimum_days_notice: 7
    }
  ],
  
  approval_levels: [
    {
      level: 1,
      title: 'Subject Coordinator',
      required: true
    },
    {
      level: 2,
      title: 'Vice Principal',
      required: false,
      required_if_days_gt: 3
    },
    {
      level: 3,
      title: 'Principal',
      required: false,
      required_if_days_gt: 5
    }
  ],
  
  rules: {
    min_days_notice: 5,
    allow_half_day: true,
    working_days: [1, 2, 3, 4, 5],
    accrual_method: 'academic_year', // August to July cycle
    requires_substitute: true, // Teachers need substitutes
    block_during_exams: true // Cannot take leave during exam periods
  }
};

// ============================================
// CONFIGURATION MAP
// ============================================

export const LEAVE_CONFIGS: Record<OrganizationType, OrganizationLeaveConfig> = {
  corporate: CORPORATE_CONFIG,
  government: GOVERNMENT_CONFIG,
  education: EDUCATION_CONFIG
};

/**
 * Get leave configuration based on organization type
 */
export function getLeaveConfig(orgType: OrganizationType): OrganizationLeaveConfig {
  return LEAVE_CONFIGS[orgType];
}

/**
 * Get leave configuration based on industry
 */
export function getLeaveConfigByIndustry(industry: string | null | undefined): OrganizationLeaveConfig {
  const orgType = industry === 'government' ? 'government' 
                : industry === 'education' ? 'education' 
                : 'corporate';
  return LEAVE_CONFIGS[orgType];
}
