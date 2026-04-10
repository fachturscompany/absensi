import type { DayType, ExcusedReasonCode, WorkMode, PunchException, HalfDayType } from '@/lib/attendance-status-calculator';

// ─── Emergency Contact ────────────────────────────────────────────────────────

export interface IEmergencyContact {
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface IUser {
    id: string;
    employee_code?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    display_name?: string | null;
    phone?: string;
    phone_code?: string | null;
    mobile?: string;
    mobile_code?: string | null;
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
    home_location?: string | null;
    personal_email?: string | null;
    profile_photo_url?: string | null;
    emergency_contact?: IEmergencyContact | null;
    is_active?: boolean;
    role_id?: string | null;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
}

// ─── Organization ─────────────────────────────────────────────────────────────

export interface IOrganization {
    id: string;
    code?: string;
    name: string;
    legal_name?: string | null;
    description?: string | null;
    inv_code?: string | null;
    tax_id?: string;
    industry?: string;
    size_category?: string;
    timezone?: string;
    currency_code?: string;
    country_code?: string;
    address?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo_url?: string | null;
    is_active: boolean;
    subscription_tier?: string;
    time_format?: '12h' | '24h';
    subscription_expires_at?: string | null;
    created_at: string;
    updated_at?: string;
}

// ─── Group / Department ───────────────────────────────────────────────────────

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

export type IDepartments = IGroup;

// ─── Group Member ─────────────────────────────────────────────────────────────

export interface IGroupMember {
    id: string;
    organization_id?: string | null;
    department_id?: string | null;
    is_active: boolean;
    biodata_nik?: string | null;
    hire_date?: string;
    user?: {
        id?: string;
        first_name?: string | null;
        last_name?: string | null;
        display_name?: string | null;
        profile_photo_url?: string | null;
        nik?: string | null;
        jenis_kelamin?: string | null;
        agama?: string | null;
        email?: string | null;
    } | null;
    departments?: {
        id: string;
        name: string;
    } | null;
    positions?: {
        id: string;
        title: string;
    } | null;
}

// ─── Position ─────────────────────────────────────────────────────────────────

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

// ─── Project ──────────────────────────────────────────────────────────────────

export interface IProjectMetadata {
    budgetType?: string;
    budgetBasedOn?: string;
    budgetCost?: string | number;
    budgetNotifyMembers?: boolean;
    budgetNotifyAt?: string;
    budgetNotifyWho?: string;
    budgetStopTimers?: boolean;
    budgetStopAt?: string;
    budgetResets?: string;
    budgetIncludeNonBillable?: boolean;
    memberLimits?: Array<{
        members: string[];
        type: string;
        basedOn: string;
        cost: string;
        resets: string;
        startDate: string | null;
    }>;
    memberLimitNotifyAt?: string;
    memberLimitNotifyMembers?: boolean;
    clientName?: string | null;
    tracking_enabled?: boolean;
    [key: string]: unknown;
}

export interface ITeams {
    id: number;
    organization_id: number;
    code: string;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
    settings?: string;
    metadata?: string;
}

export interface ITeamMember {
  id: number;
  team_id: number;
  organization_member_id: number;
  positions: number | null;
  is_primary_team: boolean;
  joined_at: string;
  organization_members: {
    id: number;
    is_active: boolean;
    user: {
      first_name: string | null;
      last_name: string | null;
      display_name: string | null;
      profile_photo_url: string | null;
      email: string | null;
    } | null;
  };
  positions_detail?: {
    id: number;
    title: string;
  } | null;
}

// ── Domain types ─────────────────────────────────────────────────────────────

export interface IProjectTeamMemberUser {
    id: string;
    first_name: string | null;
    last_name: string | null;
    profile_photo_url: string | null;
}

export interface IProjectOrganizationMember {
    id: number;
    user_id: string;
    user: IProjectTeamMemberUser | null;
}

export interface IProjectTeamMember {
    team_id: number;
    organization_member_id: number;
    role: string;
    organization_members: IProjectOrganizationMember | null;
}

export interface IProjectTeam {
    id: number;
    name: string;
    team_members?: IProjectTeamMember[];
}

export interface IProjectTeamProject {
    team_id: number;
    teams: IProjectTeam | null;
}

// ── Raw Supabase response types ──────────────────────────────────────────────

export interface ISupabaseProjectOrganizationMember {
    id: number;
    user_id: string;
    user: IProjectTeamMemberUser[];
}

export interface ISupabaseProjectTeamMember {
    team_id: number;
    organization_member_id: number;
    role: string;
    organization_members: ISupabaseProjectOrganizationMember[];
}

export interface IProjectClientProject {
    client_id: number;
    clients: Pick<IClient, 'id' | 'name'> | null;
}

export interface IProject {
    id: number;
    organization_id: number;
    code: string;
    name: string;
    description?: string | null;
    lifecycle_status: string;
    priority?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    is_billable: boolean;
    currency_code?: string;
    budget_amount?: number | null;
    budget_hours?: number | null;
    color_code?: string | null;
    metadata?: IProjectMetadata | null;
    is_active?: boolean;
    created_at: string;
    updated_at?: string;
    deleted_at?: string | null;

    organizations?: { id: number; name: string };
    team_projects?: IProjectTeamProject[];
    tasks?: { count: number }[];
}

export interface IProjectMember {
    id: string;
    userId: string;
    name: string;
    photoUrl: string | null;
}

export interface IProjectWithMembers extends IProject {
    members: IProjectMember[];
}

export interface ISimpleMember {
    id: string;
    name: string;
    department_id?: string | null;
}

// ─── Project Payload Types ────────────────────────────────────────────────────

export interface CreateProjectPayload {
    name: string;
    description?: string | null;
    priority?: string | null;
    lifecycle_status?: string;
    is_billable?: boolean;
    start_date?: string | null;
    end_date?: string | null;
    metadata?: IProjectMetadata;
    teams?: number[];
}

export interface UpdateProjectPayload {
    name?: string;
    description?: string | null;
    priority?: string | null;
    lifecycle_status?: string;
    is_billable?: boolean;
    start_date?: string | null;
    end_date?: string | null;
    metadata?: IProjectMetadata;
    teams?: number[];
}

// ─── Project UI Types ─────────────────────────────────────────────────────────

export interface MemberLimit {
    members: string[];
    type: string;
    basedOn: string;
    cost: string;
    resets: string;
    startDate: string | null;
}

export interface NewProjectForm {
    // General
    names: string;
    description: string;
    priority: "high" | "medium" | "low";
    lifecycleStatus: string;
    // Dates
    startDate: string | null;
    endDate: string | null;
    // Billing
    billable: boolean;
    // Tracking
    disableActivity: boolean;
    allowTracking: boolean;
    disableIdle: boolean;
    // Relations
    members: string[];
    teams: string[];
    // Budget
    budgetType: string;
    budgetBasedOn: string;
    budgetCost: string;
    budgetNotifyMembers: boolean;
    budgetNotifyAt: string;
    budgetNotifyWho: string;
    budgetStopTimers: boolean;
    budgetStopAt: string;
    budgetResets: string;
    budgetIncludeNonBillable: boolean;
    // Member limits
    memberLimits: MemberLimit[];
    memberLimitNotifyAt: string;
    memberLimitNotifyMembers: boolean;
}

export interface ProjectMember {
    id: string;
    name: string;
    avatarUrl: string | null;
}

export interface Project {
    id: string;
    name: string;
    teams: string[];
    members: ProjectMember[];
    taskCount: number;
    budgetLabel: string;
    memberLimitLabel: string;
    archived: boolean;
}

export interface DuplicateProjectOptions {
    name: string;
    keepTasks: boolean;
    keepTasksAssignees: boolean;
    keepTasksCompleted: boolean;
    keepAllMembers: boolean;
    keepBudget: boolean;
    keepMemberLimits: boolean;
}

// ─── Organization Member ──────────────────────────────────────────────────────

export interface IOrganization_member {
    id: string;
    organization_id: string;
    user_id: string;
    employee_id?: string;
    department_id?: string;
    position_id?: string;
    direct_manager_id?: string;
    role_id?: string;
    hire_date: string;
    probation_end_date?: string;
    contract_type?: string;
    employment_status?: string;
    employment_comments?: string | null;
    termination_date?: string;
    work_location?: string;
    tax_id_number?: string;
    tax_type?: string;
    account_code?: string;
    currency?: string;
    daily_limit_hours?: number;
    weekly_limit_hours?: number;
    allow_tracking?: boolean;
    require_tasks?: boolean;
    allow_manual_time?: boolean;
    overtime_daily_threshold?: number;
    overtime_weekly_threshold?: number;
    idle_timeout_minutes?: number;
    break_reminder_interval_minutes?: number;
    tracking_window_start?: string;
    tracking_window_end?: string;
    lock_entries_after_days?: number;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
    computed_name?: string;
    groupName?: string;
    biodata_nik?: string;
    user?: IUser;
    groups?: IGroup;
    departments?: IGroup;
    positions?: IPositions;
    organization?: IOrganization;
    rfid_cards?: IRfidCard;
    role?: IRole;
    organization_member_roles?: Array<{
        id: string;
        system_roles: IRole | IRole[];
    }>;
}

// ─── Performance ──────────────────────────────────────────────────────────────

export interface IMemberPerformance {
    counts: {
        present: number;
        late: number;
        absent: number;
        excused: number;
    };
    lastSeen?: string | null;
    averageWorkDurationMinutes?: number;
    averageCheckInTime?: string | null;
    averageCheckOutTime?: string | null;
    recent30?: Array<{
        id?: string;
        attendance_date?: string;
        status?: string;
        work_duration_minutes?: number | null;
    }>;
}

export interface IMemberAttendancePoint {
    date: string;
    count: number;
    averageWorkDurationMinutes?: number | null;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

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
    day_type?: DayType;
    leave_reason_code?: ExcusedReasonCode;
    work_mode?: WorkMode;
    punch_exception?: PunchException;
    compliant?: boolean;
    break_violation?: boolean;
    half_day_type?: HalfDayType;
    organization_member?: IOrganization_member;
    timezone?: string;
    time_format?: '12h' | '24h';
}

// ─── Work Schedule ────────────────────────────────────────────────────────────

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
    work_schedule_details?: IWorkScheduleDetail[];
}

export interface IWorkScheduleDetail {
    id: number;
    work_schedule_id: number;
    day_of_week: number;
    is_working_day: boolean;
    start_time?: string;
    end_time?: string;
    core_hours_start?: string;
    core_hours_end?: string;
    break_start: string;
    break_end: string;
    break_duration_minutes?: number | null;
    flexible_hours: boolean;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
    work_schedule?: IWorkSchedule;
}

// ─── Shift ────────────────────────────────────────────────────────────────────

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

// ─── Role & Permission ────────────────────────────────────────────────────────

export interface IRole {
    id: string;
    code?: string;
    name: string;
    description: string;
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
    user: IUser;
    role: IRole;
}

// ─── RFID ─────────────────────────────────────────────────────────────────────

export interface IRfidCard {
    id: string;
    organization_member_id: string;
    card_number: string;
    card_type: string;
    issue_date: string;
    organization_member: IOrganization_member;
}

// ─── Device ───────────────────────────────────────────────────────────────────

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

// ─── Invitation ───────────────────────────────────────────────────────────────

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
    organization: IOrganization;
    inviter?: IUser;
    role: IRole;
    department?: IDepartments;
    position?: IPositions;
}

// ─── Task ─────────────────────────────────────────────────────────────────────

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
    parent_task_id?: number | null;
    status_id: number;
    position_in_column: number;
    name: string;
    description?: string | null;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    estimated_hours?: number | null;
    due_date?: string | null;
    completed_at?: string | null;
    lifecycle_status?: 'active' | 'completed' | 'archived';
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
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

// ─── Client ───────────────────────────────────────────────────────────────────

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
    project_count?: number;
    task_count?: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}