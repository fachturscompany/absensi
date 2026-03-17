# Multi-Organization Multi-Role Architecture

## 📋 Daftar Isi
1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [User Flow](#user-flow)
4. [State Management](#state-management)
5. [Component Architecture](#component-architecture)
6. [API Endpoints](#api-endpoints)
7. [Setup Wizard Flow](#setup-wizard-flow)
8. [Member Import Process](#member-import-process)

---

## Overview

Sistem ini memungkinkan **satu user untuk mengelola lebih dari satu organisasi** dengan role yang berbeda di setiap organisasi.

### Key Features:
- ✅ User bisa membuat organisasi baru saat login pertama
- ✅ Role adalah per-organization (bukan global)
- ✅ User tidak bisa switch role setelah login (harus logout dan login ulang)
- ✅ Setup maksimal 5 menit dengan Setup Wizard
- ✅ Import members via Excel (flashdisk/USB)
- ✅ Data timeline kosong di awal, diisi via import

### Role Hierarchy:
```
Super Admin (SA001) - Global system admin
├── Admin Organization (A001) - Org admin
│   ├── Support
│   ├── Manager
│   └── Staff
└── Regular User (M001) - Member biasa
```

---

## Database Schema

### Key Tables dan Relationships:

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS (Global)                       │
│  id | email | first_name | last_name | phone | avatar | ... │
└──────────────────────┬──────────────────────────────────────┘
                       │ 1:many
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              ORGANIZATION_MEMBERS (User-Org Link)            │
│  id | user_id | organization_id | role_id | created_at | ...│
└──────────────────────┬──────────────────────────────────────┘
                       │ 1:many
                       ▼
┌──────────────────────────────────────────────────────────────┐
│         ORGANIZATION_MEMBER_ROLES (Role Assignment)          │
│  id | organization_member_id | role_id | created_at | ...   │
└──────────────────────┬──────────────────────────────────────┘
                       │ many:1
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              SYSTEM_ROLES (Role Definitions)                 │
│  id | code | name | description | is_system | created_at    │
│  Contoh: A001 (Admin), M001 (Member), SA001 (Super Admin)   │
└──────────────────────────────────────────────────────────────┘
```

### Tabel Utama:

#### 1. **users**
```sql
id (PK)
email (UNIQUE)
first_name
last_name
phone
avatar
created_at
updated_at
```

#### 2. **organizations**
```sql
id (PK)
name
code
country_code
timezone
address
created_at
updated_at
```

#### 3. **organization_members**
```sql
id (PK)
user_id (FK → users)
organization_id (FK → organizations)
role_id (FK → system_roles) -- Default role saat join
created_at
updated_at
```

#### 4. **organization_member_roles**
```sql
id (PK)
organization_member_id (FK → organization_members)
role_id (FK → system_roles)
created_at
updated_at
```

#### 5. **system_roles**
```sql
id (PK)
code (UNIQUE) -- A001, M001, SA001, etc
name
description
is_system (boolean)
created_at
updated_at
```

#### 6. **nfk_permissions**
```sql
id (PK)
module (leaves, attendance, members, etc)
resource (request, balance, record, etc)
action (create, read, update, delete, approve)
code (UNIQUE) -- leaves:request:approve
name
created_at
updated_at
```

#### 7. **organization_members** (Extended)
```sql
-- Relasi ke departments, positions, work_schedules
department_id (FK → departments)
position_id (FK → positions)
```

---

## User Flow

### 1. Login Flow
```
┌─────────────────────────────────────────────────────────────┐
│                    USER LOGIN                               │
│  Email + Password → Supabase Auth                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ User sudah punya org?       │
        └────────┬───────────┬────────┘
                 │           │
            YES  │           │  NO
                 ▼           ▼
        ┌──────────────┐  ┌─────────────────────┐
        │ Org Selector │  │ Create Org / Invite │
        │   Page       │  │   (Setup Wizard)    │
        └──────┬───────┘  └──────────┬──────────┘
               │                     │
               └─────────┬───────────┘
                         ▼
        ┌────────────────────────────┐
        │   Role Selector Page       │
        │ (Pilih role di org ini)    │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Dashboard / Attendance    │
        │  (Role-based access)       │
        └────────────────────────────┘
```

### 2. Organization Selector Page
```
Menampilkan:
- List organisasi yang user miliki
- Button "Create New Organization"
- Button "Accept Invitation" (jika ada)

User Action:
- Klik org → Go to Role Selector
- Klik "Create New" → Go to Setup Wizard
- Klik "Accept Invite" → Join org
```

### 3. Role Selector Page
```
Menampilkan:
- Organization name
- List roles yang user punya di org ini
- Role description dan permissions

User Action:
- Klik role → Set as current role → Go to Dashboard
- Tidak bisa switch role setelah login
```

### 4. Setup Wizard (5 Menit)
```
Step 1: Organization Info (1 menit)
├── Organization Name
├── Organization Code
├── Country
├── Timezone
└── Address

Step 2: Basic Settings (1 menit)
├── Currency
├── Work Hours
├── Attendance Method
└── Leave Policy

Step 3: Import Members (2 menit)
├── Upload Excel file
├── Map columns
├── Preview data
└── Import

Step 4: Role Assignment (1 menit)
├── Assign roles to imported members
└── Set default role

Result: Organization ready to use
```

---

## State Management

### Updated `org-store.ts`
```typescript
interface OrgState {
  // Current Organization
  organizationId: number | null;
  organizationName: string | null;
  timezone: string;
  
  // Current Role
  currentRole: string | null;
  currentRoleId: number | null;
  
  // User's Organizations
  organizations: Organization[];
  
  // Methods
  setOrganizationId: (id: number, name: string) => void;
  setCurrentRole: (roleCode: string, roleId: number) => void;
  setOrganizations: (orgs: Organization[]) => void;
  setTimezone: (tz: string) => void;
  reset: () => void;
}

interface Organization {
  id: number;
  name: string;
  code: string;
  timezone: string;
  roles: Role[];
}

interface Role {
  id: number;
  code: string;
  name: string;
  description: string;
}
```

### Updated `user-store.ts`
```typescript
interface AuthState {
  user: IUser | null;
  
  // Per-Organization Role
  role: string | null;
  roleId: number | null;
  permissions: string[];
  
  // User's Organizations
  userOrganizations: UserOrganization[];
  
  // Methods
  setUser: (updater: UserUpdater) => void;
  setRole: (role: string, roleId: number) => void;
  setPermissions: (permissions: string[]) => void;
  setUserOrganizations: (orgs: UserOrganization[]) => void;
  reset: () => void;
}

interface UserOrganization {
  id: number;
  organizationId: number;
  organizationName: string;
  roles: Role[];
}
```

---

## Component Architecture

### Page Structure
```
src/app/
├── auth/
│   ├── login/
│   ├── signup/
│   └── callback/
│
├── organization-selector/          ← NEW
│   └── page.tsx
│
├── role-selector/                  ← NEW
│   └── page.tsx
│
├── setup-wizard/                   ← NEW
│   ├── page.tsx
│   ├── steps/
│   │   ├── org-info.tsx
│   │   ├── basic-settings.tsx
│   │   ├── import-members.tsx
│   │   └── role-assignment.tsx
│   └── components/
│       ├── member-import.tsx
│       └── role-mapper.tsx
│
├── (dashboard)/
│   └── page.tsx (existing, updated for org/role)
│
├── attendance/
│   └── page.tsx (existing, updated for org/role)
│
└── members/
    └── page.tsx (existing, updated for org/role)
```

### Component Hierarchy
```
┌─────────────────────────────────────────────┐
│         Organization Selector               │
│  ┌─────────────────────────────────────┐   │
│  │ - Organization List                 │   │
│  │ - Create New Org Button              │   │
│  │ - Accept Invitation Button           │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│          Role Selector                      │
│  ┌─────────────────────────────────────┐   │
│  │ - Role List                         │   │
│  │ - Role Description                  │   │
│  │ - Permissions Display               │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Setup Wizard (if new org)           │
│  ┌─────────────────────────────────────┐   │
│  │ Step 1: Organization Info           │   │
│  │ Step 2: Basic Settings              │   │
│  │ Step 3: Import Members              │   │
│  │ Step 4: Role Assignment             │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│      Dashboard (Role-based access)          │
│  ┌─────────────────────────────────────┐   │
│  │ - Attendance                        │   │
│  │ - Members                           │   │
│  │ - Leaves                            │   │
│  │ - Settings (if admin)               │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## API Endpoints

### Authentication
```
POST /api/auth/login
POST /api/auth/signup
POST /api/auth/logout
GET  /api/auth/me
```

### Organizations
```
GET    /api/organizations                    # List user's orgs
POST   /api/organizations                    # Create new org
GET    /api/organizations/:id                # Get org details
PUT    /api/organizations/:id                # Update org
DELETE /api/organizations/:id                # Delete org
```

### Organization Members
```
GET    /api/organizations/:id/members        # List members
POST   /api/organizations/:id/members        # Add member
PUT    /api/organizations/:id/members/:memberId
DELETE /api/organizations/:id/members/:memberId
```

### Roles
```
GET    /api/organizations/:id/roles          # List available roles
GET    /api/roles/:roleId/permissions        # Get role permissions
```

### Member Import
```
POST   /api/organizations/:id/members/import # Import from Excel
GET    /api/organizations/:id/members/import/template # Download template
```

---

## Setup Wizard Flow

### Step 1: Organization Info (1 menit)
```
Input:
- Organization Name (required)
- Organization Code (required, unique)
- Country (required)
- Timezone (required)
- Address (optional)

Validation:
- Name: min 3 chars, max 100
- Code: alphanumeric, no spaces
- Country: from list
- Timezone: from list

Output:
- Create organization record
- Set as current organization
```

### Step 2: Basic Settings (1 menit)
```
Input:
- Currency (required)
- Work Hours Start (required)
- Work Hours End (required)
- Attendance Method (required)
- Leave Policy (required)

Validation:
- Work hours: valid time format
- Attendance method: in list (manual, biometric, gps, etc)
- Leave policy: in list

Output:
- Update organization settings
```

### Step 3: Import Members (2 menit)
```
Input:
- Excel file upload
- Column mapping (auto-detect or manual)

Excel Template Columns:
- First Name (required)
- Last Name (required)
- Email (required)
- Phone (optional)
- Department (optional)
- Position (optional)
- Work Schedule (optional)

Validation:
- File format: .xlsx only
- Required columns present
- Email format valid
- No duplicate emails

Output:
- Preview imported members
- Create member records
```

### Step 4: Role Assignment (1 menit)
```
Input:
- Select default role for imported members
- Optional: assign specific roles to specific members

Roles Available:
- Admin (A001)
- Support
- Manager
- Staff
- Member (M001)

Output:
- Assign roles to members
- Setup complete
- Redirect to Dashboard
```

---

## Member Import Process

### Excel Template Format
```
| First Name | Last Name | Email              | Phone      | Department | Position | Work Schedule |
|------------|-----------|-------------------|------------|------------|----------|---------------|
| John       | Doe       | john@example.com  | 081234567  | IT         | Manager  | Monday-Friday |
| Jane       | Smith     | jane@example.com  | 081234568  | HR         | Staff    | Monday-Friday |
```

### Import Flow
```
1. User uploads Excel file
   ↓
2. System validates file format
   ↓
3. System detects/maps columns
   ↓
4. System validates data
   ↓
5. Show preview (success/error count)
   ↓
6. User confirms import
   ↓
7. Create members in database
   ↓
8. Assign default role
   ↓
9. Send invitation emails (optional)
   ↓
10. Show import summary
```

### Error Handling
```
- Invalid file format → Show error, ask to re-upload
- Missing required columns → Show error, ask to re-upload
- Duplicate emails → Skip or merge
- Invalid email format → Show warning, allow skip
- Missing department/position → Create default or skip
```

---

## Access Control

### Role-Based Access
```
Super Admin (SA001)
├── Can access all organizations
├── Can manage all users
├── Can manage all roles
└── Can view all data

Admin Organization (A001)
├── Can access own organization
├── Can manage members in org
├── Can manage roles in org
├── Can manage settings
└── Can view all data in org

Support / Manager / Staff
├── Can access own organization
├── Can view assigned data
├── Limited management capabilities
└── Cannot manage settings

Member (M001)
├── Can access own organization
├── Can view own data only
├── Can submit attendance/leaves
└── Cannot manage anything
```

### Permission Matrix
```
                    | SA001 | A001 | Support | Manager | Staff | M001 |
--------------------|-------|------|---------|---------|-------|------|
View Dashboard      |  ✓    |  ✓   |    ✓    |    ✓    |   ✓   |  ✓   |
View Members        |  ✓    |  ✓   |    ✓    |    ✓    |   ✓   |  ✗   |
Add Members         |  ✓    |  ✓   |    ✗    |    ✗    |   ✗   |  ✗   |
Manage Roles        |  ✓    |  ✓   |    ✗    |    ✗    |   ✗   |  ✗   |
View Attendance     |  ✓    |  ✓   |    ✓    |    ✓    |   ✓   |  ✓   |
Approve Attendance  |  ✓    |  ✓   |    ✓    |    ✓    |   ✗   |  ✗   |
View Leaves         |  ✓    |  ✓   |    ✓    |    ✓    |   ✓   |  ✓   |
Approve Leaves      |  ✓    |  ✓   |    ✓    |    ✓    |   ✗   |  ✗   |
Manage Settings     |  ✓    |  ✓   |    ✗    |    ✗    |   ✗   |  ✗   |
```

---

## Middleware & Route Protection

### Protected Routes
```
/organization-selector      - After login, before org selection
/role-selector             - After org selection, before role selection
/setup-wizard              - Only for new org
/(dashboard)/*             - Requires org + role selected
/attendance/*              - Requires org + role selected
/members/*                 - Requires org + role selected
/settings/*                - Requires admin role
```

### Middleware Logic
```
1. Check if user authenticated
   ├─ NO → Redirect to /auth/login
   └─ YES → Continue

2. Check if org selected
   ├─ NO → Redirect to /organization-selector
   └─ YES → Continue

3. Check if role selected
   ├─ NO → Redirect to /role-selector
   └─ YES → Continue

4. Check if user has permission for route
   ├─ NO → Redirect to /unauthorized
   └─ YES → Allow access
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER LOGIN                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Fetch user organizations   │
        │ (from organization_members)│
        └────────────┬───────────────┘
                     │
        ┌────────────▼───────────────┐
        │ Has organizations?         │
        └────────┬───────────┬───────┘
                 │           │
            YES  │           │  NO
                 ▼           ▼
        ┌──────────────┐  ┌─────────────────┐
        │ Org Selector │  │ Setup Wizard    │
        └──────┬───────┘  │ (Create org)    │
               │          └────────┬────────┘
               │                   │
               └─────────┬─────────┘
                         ▼
        ┌────────────────────────────┐
        │ Fetch roles for selected   │
        │ organization               │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Role Selector              │
        │ (Select role)              │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Fetch permissions for role │
        │ Update stores              │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Dashboard / Attendance     │
        │ (Role-based access)        │
        └────────────────────────────┘
```

---

## Summary

| Aspek | Detail |
|-------|--------|
| **Multi-Org** | User bisa punya multiple organizations |
| **Multi-Role** | User bisa punya multiple roles per org |
| **Role Scope** | Role adalah per-organization, bukan global |
| **Role Switch** | Tidak bisa switch role tanpa logout |
| **Setup Time** | Maksimal 5 menit dengan Setup Wizard |
| **Member Import** | Via Excel, dengan column mapping |
| **Data Timeline** | Kosong di awal, diisi via import |
| **Access Control** | Role-based dengan permission matrix |
| **Middleware** | Protect routes berdasarkan org + role |

---

## Next Steps

1. ✅ Update `org-store.ts` dengan multi-org support
2. ✅ Update `user-store.ts` dengan role per org
3. ✅ Create Organization Selector page
4. ✅ Create Role Selector page
5. ✅ Create Setup Wizard (4 steps)
6. ✅ Create Member Import component
7. ✅ Update middleware untuk org/role validation
8. ✅ Update existing pages untuk multi-org support
9. ✅ Testing dan QA

---

**Dokumentasi ini akan di-update seiring dengan progress implementasi.**
