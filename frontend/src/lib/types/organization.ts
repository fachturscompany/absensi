// Organization Types

export interface Organization {
  id: number;
  name: string;
  code: string;
  timezone: string;
  country_code: string;
  roles: Role[];
}

export interface Role {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface Permission {
  id: number;
  module: string;
  resource: string;
  action: string;
  code: string;
  name: string;
}

export interface OrganizationSettings {
  id: number;
  organization_id: number;
  work_hours_start: string;
  work_hours_end: string;
  attendance_method: string;
  leave_policy: string;
  allow_remote_attendance: boolean;
  require_photo_attendance: boolean;
}

export interface UserOrganization {
  id: number;
  organization_id: number;
  organization_name: string;
  roles: Role[];
}

export interface AttendanceRecord {
  id: number;
  organization_id: number;
  organization_member_id: number;
  recorded_by: number;
  attendance_date: string;
  check_in_time: string;
  check_out_time: string;
  face_image_url: string;
  face_match_score: number;
  status: "present" | "late" | "absent" | "excused";
  remarks: string;
  source: "mobile" | "website" | "manual";
  created_at: string;
  updated_at: string;
}

export interface MemberFaceData {
  id: number;
  organization_member_id: number;
  face_encoding: string;
  face_image_url: string;
  face_registered_at: string;
  face_verified: boolean;
  created_at: string;
  updated_at: string;
}
