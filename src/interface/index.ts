import type { DayType, ExcusedReasonCode, WorkMode, PunchException, HalfDayType } from '@/lib/attendance-status-calculator';
// Emergency Contact Interface
export interface IEmergencyContact {
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
}

export interface IUser {
    id: string;
    employee_code?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    display_name?: string | null;
    phone?: string;
    mobile?: string;
    date_of_birth?: string;
    gender?: "male" | "female" | "other" | "prefer_not_to_say" | null;
    nationality?: string;
    national_id?: string;
    nik?: string;
    jalan?: string;
    rt?: string;
    rw?: string;
    dusun?: string;
    kelurahan?: string;
    kecamatan?: string;
    profile_photo_url?: string | null;
    emergency_contact?: IEmergencyContact | null;
    is_active?: boolean;
    role_id?: string | null;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
}
export interface IOrganization {
    id: string
    code?: string
    name: string
    legal_name?: string | null
    description?: string | null
    inv_code?: string | null
    tax_id?: string
    industry?: string
    size_category?: string
    timezone?: string
    currency_code?: string
    country_code?: string
    address?: string
    city?: string
    state_province?: string
    postal_code?: string
    phone?: string
    email?: string
    website?: string
    logo_url?: string | null
    is_active: boolean
    subscription_tier?: string
    time_format?: '12h' | '24h'
    subscription_expires_at?: string | null
    created_at: string
    updated_at?: string
}


// Groups (stored as departments in database)
export interface IGroup {
    id: string;
    organization_id: string;
    parent_department_id?: string;
    code?: string;
    name: string;
    description?: string;
    head_member_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;

    organization?: IOrganization;

}

// Backward compatibility alias
export type IDepartments = IGroup;
export interface IPositions {
    id: string;
    organization_id: string;
    code?: string;
    title: string;
    description?: string;
    level?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;

    organization?: IOrganization;

}

export interface IProject {
    id: number;
    organization_id: number;
    name: string;
    client_id?: number | null;
    is_billable: boolean;
    is_active: boolean;
    archived: boolean;
    color?: string | null;
    created_at: string;
    updated_at?: string;
}

export interface IOrganization_member {
    id: string;
    organization_id: string;
    user_id: string;
    employee_id?: string;
    department_id?: string; // References group (stored as department in DB)
    position_id?: string;
    direct_manager_id?: string;
    role_id?: string; // Role within the organization (Admin Org or User)
    hire_date: string;
    probation_end_date?: string;
    contract_type?: string;
    employment_status?: string;
    termination_date?: string;
    work_location?: string;

    // Accounting & Pay
    tax_id_number?: string;
    tax_type?: string;
    account_code?: string;
    currency?: string;

    // Work Time & Limits
    daily_limit_hours?: number;
    weekly_limit_hours?: number;

    allow_tracking?: boolean;
    require_tasks?: boolean;
    allow_manual_time?: boolean;

    overtime_daily_threshold?: number;
    overtime_weekly_threshold?: number;

    idle_timeout_minutes?: number;
    break_reminder_interval_minutes?: number;

    tracking_window_start?: string; // HH:MM
    tracking_window_end?: string; // HH:MM
    lock_entries_after_days?: number;

    is_active: boolean;
    created_at: string;
    updated_at?: string;

    // Computed / Virtual fields from API
    computed_name?: string;
    groupName?: string;
    biodata_nik?: string;

    user?: IUser;
    groups?: IGroup;
    departments?: IGroup;
    positions?: IPositions;
    organization?: IOrganization;
    rfid_cards?: IRfidCard;
    role?: IRole; // Organization role details
}

// Performance data returned for a single member
export interface IMemberPerformance {
    counts: {
        present: number;
        late: number;
        absent: number;
        excused: number;
    };
    lastSeen?: string | null;
    averageWorkDurationMinutes?: number;
    // new insight fields (formatted time strings, e.g. "08:45")
    averageCheckInTime?: string | null;
    averageCheckOutTime?: string | null;
    recent30?: Array<{
        id?: string;
        attendance_date?: string;
        status?: string;
        work_duration_minutes?: number | null;
    }>;
}

// Point data for trend charts
export interface IMemberAttendancePoint {
    date: string; // YYYY-MM-DD
    count: number; // count of attendance records (present) on that date
    averageWorkDurationMinutes?: number | null;
}

export interface IAttendance {
    id: string;
    organization_member_id: string;
    attendance_date: string;
    schedule_shift_id?: string;
    sheduled_start: string;
    sheduled_end: string;
    actual_check_in?: string;
    actual_check_out?: string;
    checkin_device?: string;
    checkout_device?: string;
    checkin_method?: string;
    checkout_method?: string;
    checkin_location?: string;
    checkout_location?: string;
    check_in_photo_url?: string;
    check_out_photo_url?: string;
    work_duration_minutes?: number;
    break_duration_minutes?: number;
    overtime_minutes?: number;
    late_minutes?: number;
    early_leave_minutes?: number;
    status: "on_time" | "present" | "late" | "early_leave" | "late_and_early" | "absent" | "excused" | "excused_absence";
    validated_status?: "approved" | "rejected" | "pending";
    validated_by?: string;
    validated_at?: string;
    validated_note?: string;
    application_id?: string;
    raw_data?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
    notes?: string;

    // International-standard optional dimensions
    day_type?: DayType;               // working_day | off_day | public_holiday | leave_day
    leave_reason_code?: ExcusedReasonCode; // vacation | sick | maternity | paternity | bereavement | unpaid | training | business_trip
    work_mode?: WorkMode;             // onsite | remote | on_duty
    punch_exception?: PunchException; // none | missing_check_in | missing_check_out | missing_both
    compliant?: boolean;              // memenuhi core hours
    break_violation?: boolean;
    half_day_type?: HalfDayType;      // none | half_day_am | half_day_pm

    organization_member?: IOrganization_member;
    timezone?: string;
    time_format?: '12h' | '24h';
}

export interface IWorkSchedule {
    id: number;
    organization_id: number;
    code?: string;
    name: string;
    description?: string;
    schedule_type: string;
    is_default: boolean;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
    work_schedule_details?: IWorkScheduleDetail[]
}

export interface IWorkScheduleDetail {
    id: number;
    work_schedule_id: number;
    day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
    is_working_day: boolean;

    start_time?: string; // HH:MM:SS - Check-in time (must be earlier than core_hours_start)
    end_time?: string;   // HH:MM:SS - Check-out time (must be later than core_hours_end)

    // Core hours define the mandatory work period
    core_hours_start?: string; // HH:MM:SS
    core_hours_end?: string;   // HH:MM:SS

    break_start: string;
    break_end: string;
    break_duration_minutes?: number | null;
    flexible_hours: boolean;
    is_active: boolean;
    created_at: string;
    updated_at?: string;

    work_schedule?: IWorkSchedule;
}

export interface IShift {
    id: string;
    organization_id: string;
    code: string;
    name: string;
    description?: string | null;
    start_time: string;
    end_time: string;
    overnight?: boolean;
    break_duration_minutes?: number;
    color_code?: string | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface IShiftAssignment {
    id: string;
    organization_member_id: string;
    shift_id: string;
    assignment_date: string;
    created_by?: string | null;
    created_at?: string;

    organization_member?: IOrganization_member;
    shift?: Pick<IShift, "id" | "code" | "name" | "start_time" | "end_time">;
}

export interface IMemberSchedule {
    id: string;
    organization_member_id: string;
    work_schedule_id: string;

    shift_id?: string;
    effective_date: string;
    end_date?: string | null;
    is_active: boolean;
    created_at: string;
    updated_at?: string;

    organization_member?: IOrganization_member;
    work_schedule?: IWorkSchedule;
}

export interface IRole {
    id: string;
    code?: string;
    name: string;
    description: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

export interface IPermission {
    id: string;
    code?: string;
    module: string;
    name: string;
    description: string;
}

export interface IRolePermission {
    id: string;
    role_id: number;
    permission_id: string;
    created_at: string;
    role?: IRole;
    permission: IPermission;
}

export interface IUserRole {
    user_id: string;
    role_id: string;

    user: IUser
    role: IRole;
}

export interface IRfidCard {
    id: string;
    organization_member_id: string;
    card_number: string;
    card_type: string;
    issue_date: string;
    organization_member: IOrganization_member;
}

export interface IDeviceType {
    id: string;
    code?: string;
    name: string;
    category: string;
    manufacturer?: string;
    model?: string;
    specifications?: Record<string, unknown>;
    created_at: string;
}

export interface IAttendanceDevice {
    id: string;
    organization_id: string;
    device_type_id: string;
    device_code: string;
    device_name: string;
    serial_number?: string;
    ip_address?: string;
    mac_address?: string;
    location?: string;
    latitude?: string;
    longitude?: string;
    radius_meters?: number;
    firmware_version?: string;
    last_sync_at?: string;
    is_active: boolean;
    configuration?: {
        allow_selfie?: boolean;
        require_location?: boolean;
        max_distance?: number;
        [key: string]: unknown;
    };
    created_at: string;
    updated_at?: string;
    device_types?: IDeviceType;
    organization?: IOrganization;
}

export interface IMemberInvitation {
    id: string;
    organization_id: string;
    email: string;
    invited_by: string;
    role_id?: string;
    department_id?: string;
    position_id?: string;
    invitation_token: string;
    status: 'pending' | 'accepted' | 'expired' | 'cancelled';
    message?: string;
    phone?: string;
    expires_at: string;
    accepted_at?: string;
    created_at: string;
    updated_at?: string;

    // Relations (populated via Supabase select)
    organization?: IOrganization;
    inviter?: IUser;
    role?: IRole;
    department?: IDepartments;
    position?: IPositions;
}

export interface ITaskStatus {
    id: number;
    organization_id: number;
    code: string;
    name: string;
    color: string;
    position: number;
    wip_limit?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface ITask {
    id: number;
    project_id: number;
    parent_task_id?: number | null;
    status_id: number;
    position_in_column: number;
    name: string;
    description?: string | null;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    estimated_hours?: number | null;
    actual_hours?: number;
    due_date?: string | null;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;

    project?: {
        id: number;
        name: string;
        client?: Array<{
            id: number;
            name: string;
        }>;
    };
    assignees?: ITaskAssignee[];
    task_status?: ITaskStatus;
}

export interface ITaskAssignee {
    id: number;
    task_id: number;
    organization_member_id: number;
    role: 'assignee' | 'reviewer' | 'watcher';
    is_primary: boolean;
    assigned_at?: string;
    updated_at?: string;

    member?: IOrganization_member;
}

export interface IClient {
    id: number;
    organization_id: number;
    name: string;
    email?: string | null;
    phone?: string;
    address?: string;
    status: 'active' | 'inactive' | 'archived' | 'deleted';
    budget_type?: 'total_hours' | 'total_cost' | 'monthly_hours' | 'monthly_cost' | null;
    budget_amount?: number | null;
    budget_currency?: string | null;
    notify_percentage?: number | null;
    invoice_notes?: string | null;
    net_terms_days?: number | null;
    auto_invoice_frequency?: string | null;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;

    // Computed or Joined fields
    project_count?: number;
    task_count?: number;
    projects?: IProject[];
}
