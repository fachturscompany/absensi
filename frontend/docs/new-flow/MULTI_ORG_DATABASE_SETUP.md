# Multi-Organization Database Setup

## 📋 Daftar Isi
1. [Database Schema Overview](#database-schema-overview)
2. [Required Tables](#required-tables)
3. [Relationships](#relationships)
4. [Indexes](#indexes)
5. [Sample Data](#sample-data)
6. [Migration Guide](#migration-guide)

---

## Database Schema Overview

### Current Tables (Existing)
```
✓ users
✓ organizations
✓ organization_members
✓ system_roles
✓ nfk_permissions
✓ departments
✓ positions
✓ attendance_records
✓ leave_requests
✓ work_schedules
```

### New/Modified Tables
```
✓ organization_member_roles (NEW - for multi-role support)
✓ organization_settings (NEW - for org-specific settings)
✓ member_import_logs (NEW - for tracking imports)
```

---

## Required Tables

### 1. users (Existing - No Changes)
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatar TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. organizations (Existing - May Need Updates)
```sql
CREATE TABLE organizations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  country_code VARCHAR(2),
  timezone VARCHAR(50) DEFAULT 'UTC',
  address TEXT,
  currency VARCHAR(3) DEFAULT 'IDR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_organizations_code ON organizations(code);
CREATE INDEX idx_organizations_created_at ON organizations(created_at);
```

### 3. organization_members (Existing - May Need Updates)
```sql
CREATE TABLE organization_members (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id BIGINT REFERENCES departments(id),
  position_id BIGINT REFERENCES positions(id),
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, organization_id)
);

-- Add indexes
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_status ON organization_members(status);
```

### 4. system_roles (Existing - May Need Updates)
```sql
CREATE TABLE system_roles (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code VARCHAR(50) UNIQUE NOT NULL, -- A001, M001, SA001, etc
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false, -- true for system roles
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_system_roles_code ON system_roles(code);

-- Sample data
INSERT INTO system_roles (code, name, description, is_system) VALUES
  ('SA001', 'Super Admin', 'System Super Administrator', true),
  ('A001', 'Admin', 'Organization Administrator', true),
  ('M001', 'Member', 'Regular Member', true),
  ('SUP', 'Support', 'Support Staff', false),
  ('MGR', 'Manager', 'Department Manager', false),
  ('STF', 'Staff', 'Staff Member', false);
```

### 5. organization_member_roles (NEW - Multi-Role Support)
```sql
CREATE TABLE organization_member_roles (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  organization_member_id BIGINT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(organization_member_id, role_id)
);

-- Add indexes
CREATE INDEX idx_org_member_roles_member_id ON organization_member_roles(organization_member_id);
CREATE INDEX idx_org_member_roles_role_id ON organization_member_roles(role_id);
```

### 6. nfk_permissions (Existing - May Need Updates)
```sql
CREATE TABLE nfk_permissions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  module VARCHAR(50) NOT NULL, -- attendance, leaves, members, settings
  resource VARCHAR(50) NOT NULL, -- record, request, member, setting
  action VARCHAR(50) NOT NULL, -- create, read, update, delete, approve
  code VARCHAR(100) UNIQUE NOT NULL, -- attendance:record:create
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_permissions_code ON nfk_permissions(code);
CREATE INDEX idx_permissions_module ON nfk_permissions(module);
```

### 7. organization_settings (NEW - Org-Specific Settings)
```sql
CREATE TABLE organization_settings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  organization_id BIGINT NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  work_hours_start TIME DEFAULT '08:00:00',
  work_hours_end TIME DEFAULT '17:00:00',
  attendance_method VARCHAR(50) DEFAULT 'manual', -- manual, biometric, gps, etc
  leave_policy VARCHAR(50) DEFAULT 'standard',
  allow_remote_attendance BOOLEAN DEFAULT false,
  require_photo_attendance BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_org_settings_org_id ON organization_settings(organization_id);
```

### 8. member_import_logs (NEW - Import Tracking)
```sql
CREATE TABLE member_import_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  imported_by BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  file_name VARCHAR(255),
  total_rows INT,
  imported_count INT DEFAULT 0,
  skipped_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  error_details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_import_logs_org_id ON member_import_logs(organization_id);
CREATE INDEX idx_import_logs_status ON member_import_logs(status);
CREATE INDEX idx_import_logs_created_at ON member_import_logs(created_at);
```

### 9. departments (Existing - May Need Updates)
```sql
CREATE TABLE departments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  head_id BIGINT REFERENCES organization_members(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_departments_org_id ON departments(organization_id);
CREATE INDEX idx_departments_name ON departments(name);
```

### 10. positions (Existing - May Need Updates)
```sql
CREATE TABLE positions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  level INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_positions_org_id ON positions(organization_id);
CREATE INDEX idx_positions_name ON positions(name);
```

### 11. attendance_records (Existing - May Need Updates)
```sql
CREATE TABLE attendance_records (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  organization_member_id BIGINT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  status VARCHAR(20) DEFAULT 'absent', -- present, late, absent, excused
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_attendance_org_id ON attendance_records(organization_id);
CREATE INDEX idx_attendance_member_id ON attendance_records(organization_member_id);
CREATE INDEX idx_attendance_date ON attendance_records(attendance_date);
CREATE INDEX idx_attendance_status ON attendance_records(status);
```

### 12. leave_requests (Existing - May Need Updates)
```sql
CREATE TABLE leave_requests (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  organization_member_id BIGINT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  leave_type_id BIGINT REFERENCES leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
  reason TEXT,
  approved_by BIGINT REFERENCES organization_members(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_leave_requests_org_id ON leave_requests(organization_id);
CREATE INDEX idx_leave_requests_member_id ON leave_requests(organization_member_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
```

---

## Relationships

### Entity Relationship Diagram
```
┌─────────────┐
│   users     │
│  (Global)   │
└──────┬──────┘
       │ 1:many
       ▼
┌──────────────────────────────────────┐
│   organization_members               │
│  (User-Org Link)                     │
└──────┬──────────────────────────────┘
       │ 1:many
       ▼
┌──────────────────────────────────────┐
│   organization_member_roles          │
│  (Multi-Role Support)                │
└──────┬──────────────────────────────┘
       │ many:1
       ▼
┌──────────────────────────────────────┐
│   system_roles                       │
│  (Role Definitions)                  │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│   organizations                      │
│  (Organization Data)                 │
└──────┬──────────────────────────────┘
       │ 1:many
       ├─────────────────────────────────┐
       │                                 │
       ▼                                 ▼
┌──────────────────┐        ┌──────────────────────────┐
│  departments     │        │ organization_settings    │
└──────────────────┘        └──────────────────────────┘
       │ 1:many
       ▼
┌──────────────────────────────────────┐
│   organization_members               │
│  (Department Members)                │
└──────────────────────────────────────┘
```

---

## Indexes

### Performance Indexes
```sql
-- Users
CREATE INDEX idx_users_email ON users(email);

-- Organizations
CREATE INDEX idx_organizations_code ON organizations(code);
CREATE INDEX idx_organizations_created_at ON organizations(created_at);

-- Organization Members
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_status ON organization_members(status);
CREATE INDEX idx_org_members_user_org ON organization_members(user_id, organization_id);

-- Organization Member Roles
CREATE INDEX idx_org_member_roles_member_id ON organization_member_roles(organization_member_id);
CREATE INDEX idx_org_member_roles_role_id ON organization_member_roles(role_id);

-- Attendance Records
CREATE INDEX idx_attendance_org_id ON attendance_records(organization_id);
CREATE INDEX idx_attendance_member_id ON attendance_records(organization_member_id);
CREATE INDEX idx_attendance_date ON attendance_records(attendance_date);
CREATE INDEX idx_attendance_status ON attendance_records(status);
CREATE INDEX idx_attendance_org_date ON attendance_records(organization_id, attendance_date);

-- Leave Requests
CREATE INDEX idx_leave_requests_org_id ON leave_requests(organization_id);
CREATE INDEX idx_leave_requests_member_id ON leave_requests(organization_member_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);

-- Departments
CREATE INDEX idx_departments_org_id ON departments(organization_id);

-- Positions
CREATE INDEX idx_positions_org_id ON positions(organization_id);

-- Import Logs
CREATE INDEX idx_import_logs_org_id ON member_import_logs(organization_id);
CREATE INDEX idx_import_logs_status ON member_import_logs(status);
```

---

## Sample Data

### Insert System Roles
```sql
INSERT INTO system_roles (code, name, description, is_system) VALUES
  ('SA001', 'Super Admin', 'System Super Administrator', true),
  ('A001', 'Admin', 'Organization Administrator', true),
  ('M001', 'Member', 'Regular Member', true),
  ('SUP', 'Support', 'Support Staff', false),
  ('MGR', 'Manager', 'Department Manager', false),
  ('STF', 'Staff', 'Staff Member', false)
ON CONFLICT (code) DO NOTHING;
```

### Insert Sample Permissions
```sql
INSERT INTO nfk_permissions (module, resource, action, code, name) VALUES
  ('attendance', 'record', 'create', 'attendance:record:create', 'Create Attendance Record'),
  ('attendance', 'record', 'read', 'attendance:record:read', 'View Attendance Record'),
  ('attendance', 'record', 'update', 'attendance:record:update', 'Update Attendance Record'),
  ('attendance', 'record', 'approve', 'attendance:record:approve', 'Approve Attendance Record'),
  ('leaves', 'request', 'create', 'leaves:request:create', 'Create Leave Request'),
  ('leaves', 'request', 'read', 'leaves:request:read', 'View Leave Request'),
  ('leaves', 'request', 'approve', 'leaves:request:approve', 'Approve Leave Request'),
  ('members', 'manage', 'create', 'members:manage:create', 'Add Member'),
  ('members', 'manage', 'read', 'members:manage:read', 'View Members'),
  ('members', 'manage', 'update', 'members:manage:update', 'Update Member'),
  ('members', 'manage', 'delete', 'members:manage:delete', 'Delete Member'),
  ('settings', 'manage', 'update', 'settings:manage:update', 'Update Settings')
ON CONFLICT (code) DO NOTHING;
```

---

## Migration Guide

### Step 1: Create New Tables
```sql
-- Create organization_member_roles table
CREATE TABLE organization_member_roles (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  organization_member_id BIGINT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_member_id, role_id)
);

-- Create organization_settings table
CREATE TABLE organization_settings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  organization_id BIGINT NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  work_hours_start TIME DEFAULT '08:00:00',
  work_hours_end TIME DEFAULT '17:00:00',
  attendance_method VARCHAR(50) DEFAULT 'manual',
  leave_policy VARCHAR(50) DEFAULT 'standard',
  allow_remote_attendance BOOLEAN DEFAULT false,
  require_photo_attendance BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create member_import_logs table
CREATE TABLE member_import_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  imported_by BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  file_name VARCHAR(255),
  total_rows INT,
  imported_count INT DEFAULT 0,
  skipped_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  error_details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 2: Add Indexes
```sql
CREATE INDEX idx_org_member_roles_member_id ON organization_member_roles(organization_member_id);
CREATE INDEX idx_org_member_roles_role_id ON organization_member_roles(role_id);
CREATE INDEX idx_org_settings_org_id ON organization_settings(organization_id);
CREATE INDEX idx_import_logs_org_id ON member_import_logs(organization_id);
CREATE INDEX idx_import_logs_status ON member_import_logs(status);
```

### Step 3: Migrate Existing Data
```sql
-- For each existing organization_member, create a default role assignment
INSERT INTO organization_member_roles (organization_member_id, role_id)
SELECT 
  om.id,
  sr.id
FROM organization_members om
JOIN system_roles sr ON sr.code = 'M001'
WHERE NOT EXISTS (
  SELECT 1 FROM organization_member_roles 
  WHERE organization_member_id = om.id
);
```

### Step 4: Create Organization Settings for Existing Orgs
```sql
-- For each existing organization, create default settings
INSERT INTO organization_settings (organization_id)
SELECT id FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM organization_settings 
  WHERE organization_id = organizations.id
);
```

---

## Verification Queries

### Check Organization Members and Roles
```sql
SELECT 
  om.id,
  u.email,
  o.name as organization,
  sr.name as role,
  om.created_at
FROM organization_members om
JOIN users u ON om.user_id = u.id
JOIN organizations o ON om.organization_id = o.id
JOIN organization_member_roles omr ON om.id = omr.organization_member_id
JOIN system_roles sr ON omr.role_id = sr.id
ORDER BY o.name, u.email;
```

### Check User's Organizations
```sql
SELECT 
  u.email,
  o.name as organization,
  string_agg(sr.name, ', ') as roles
FROM users u
JOIN organization_members om ON u.id = om.user_id
JOIN organizations o ON om.organization_id = o.id
JOIN organization_member_roles omr ON om.id = omr.organization_member_id
JOIN system_roles sr ON omr.role_id = sr.id
GROUP BY u.email, o.name
ORDER BY u.email, o.name;
```

---

**Database setup ini akan di-update seiring dengan progress implementasi.**
