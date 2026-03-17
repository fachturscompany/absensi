# 📚 Presensi - Dokumentasi Lengkap

> **Smart Attendance Management System**
> 
> Dokumentasi lengkap untuk membantu team baru memahami dan mengembangkan aplikasi Presensi.

**Version**: 1.0.0  
**Last Updated**: 2025-11-17  
**Tech Stack**: Next.js 15 + React 19 + TypeScript 5 + Supabase

---

## 📖 Daftar Isi

1. [Project Overview](#1-project-overview)
2. [Getting Started](#2-getting-started)
3. [Tech Stack](#3-tech-stack)
4. [Database Schema](#4-database-schema)
5. [API Routes](#5-api-routes)
6. [Folder Structure](#6-folder-structure)
7. [Architecture](#7-architecture)
8. [Pages & Routes](#8-pages--routes)
9. [Components](#9-components)
10. [State Management](#10-state-management)
11. [Authentication & Authorization](#11-authentication--authorization)
12. [Development Guide](#12-development-guide)
13. [Deployment](#13-deployment)
14. [Troubleshooting](#14-troubleshooting)

---

# 1. Project Overview

## 🎯 Apa itu Presensi?

Presensi adalah aplikasi web modern untuk manajemen kehadiran karyawan dengan fitur lengkap yang mendukung multi-organisasi, multi-timezone, dan role-based access control (RBAC).

## ✨ Key Features

- 🏢 **Multi-Organization**: Satu instance untuk banyak organisasi
- 👥 **Manajemen Karyawan**: Data lengkap dengan departemen & jabatan
- 📅 **Jadwal Fleksibel**: Fixed, rotating, dan flexible schedule
- ⏰ **Tracking Kehadiran**: Check-in/out dengan berbagai metode
- 📊 **Analytics Dashboard**: Laporan dan visualisasi lengkap
- 🔐 **RBAC**: Role-based access control (Super Admin, Admin Org, User)
- 🌍 **Multi-timezone**: Support berbagai zona waktu
- ⚡ **Real-time**: Live updates via Supabase
- 🎨 **Modern UI**: shadcn/ui + TailwindCSS
- 📱 **Responsive**: Desktop, tablet, mobile
- 🔄 **PWA**: Progressive Web App dengan offline support

## 🎭 User Roles

### 1. Super Admin
- Full akses ke semua organisasi
- Manage sistem global
- Approve/reject organisasi baru
- Suspend organisasi

### 2. Admin Organization
- Full akses dalam organisasi sendiri
- Manage members, departments, positions
- Manage schedules dan attendance
- View analytics dan reports

### 3. User (Employee)
- Check-in/out attendance
- View jadwal sendiri
- View attendance history sendiri
- Request leave (upcoming feature)

## 📊 Project Statistics

- **Total Files**: ~359 files
- **Total Folders**: ~121 folders
- **Database Tables**: 33 tables
- **API Endpoints**: 30+ endpoints
- **Components**: 100+ React components
- **Custom Hooks**: 20+ hooks
- **Server Actions**: 25+ actions
- **Lines of Code**: ~50,000+ LOC

---

# 2. Getting Started

## 📋 Prerequisites

- **Node.js**: v18.17+ atau v20+
- **pnpm**: v8+ (recommended) atau npm/yarn
- **Git**: Latest version
- **Supabase Account**: Free tier sudah cukup
- **Code Editor**: VS Code (recommended)

## 🚀 Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/presensi.git
cd presensi
```

### Step 2: Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```

### Step 3: Setup Environment Variables

Buat file `.env` atau `.env.local` di root project:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: For development
NODE_ENV=development
```

**Cara mendapatkan Supabase credentials:**
1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Buka project Anda
3. Pergi ke **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### Step 4: Setup Database

Database schema sudah ada di Supabase. Jika Anda setup project baru:

1. Import SQL schema dari `/supabase/migrations`
2. Atau jalankan migrations:
```bash
supabase db push
```

### Step 5: Run Development Server

```bash
# Development mode
pnpm dev

# Development dengan network access (untuk testing dari device lain)
pnpm dev:network
```

Aplikasi akan berjalan di:
- **Local**: http://localhost:3000
- **Network**: http://[your-ip]:3000

### Step 6: Login

**Super Admin Account** (harus dibuat manual di database):
- Email: admin@presensi.com
- Password: [set di Supabase Auth]

**Atau buat akun baru** melalui signup flow.

## 🛠️ Development Commands

```bash
# Development
pnpm dev              # Start dev server (dengan Turbopack)
pnpm dev:network      # Dev dengan network access

# Production
pnpm build            # Build production bundle
pnpm start            # Start production server
pnpm start:network    # Production dengan network access

# Code Quality
pnpm lint             # Run ESLint
pnpm test             # Run tests (Vitest)

# Analysis
pnpm analyze          # Analyze bundle size
```

## 📦 VS Code Extensions (Recommended)

Install extensions berikut untuk pengalaman development yang lebih baik:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "yoavbls.pretty-ts-errors",
    "usernamehw.errorlens"
  ]
}
```

---

# 3. Tech Stack

## 🎨 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5.3 | React framework dengan App Router |
| **React** | 19.1.0 | UI library |
| **TypeScript** | 5.x | Type safety |
| **TailwindCSS** | 4.x | Utility-first CSS |
| **shadcn/ui** | Latest | UI component library |
| **Radix UI** | Latest | Accessible primitives |

### UI Libraries
- **Lucide React**: Icons (0.544.0)
- **Framer Motion**: Animations (12.23.24)
- **Recharts**: Charts & visualizations (2.15.4)
- **React Leaflet**: Maps (5.0.0)

### Form & Validation
- **React Hook Form**: Form management (7.65.0)
- **Zod**: Schema validation (4.1.8)
- **@hookform/resolvers**: Form resolver (5.2.2)

## 🔙 Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | Latest | BaaS (Auth, DB, Storage, Realtime) |
| **PostgreSQL** | 15+ | Relational database |
| **Next.js API Routes** | - | API endpoints |
| **Server Actions** | - | Server-side mutations |

## 🗄️ State Management

- **TanStack Query (React Query)**: Server state (5.90.5)
- **Zustand**: Client state (5.0.8)
- **Immer**: Immutable state (10.1.3)

## 📅 Date & Time

- **date-fns**: Date manipulation (4.1.0)
- **date-fns-tz**: Timezone support (3.2.0)
- **Luxon**: Advanced date handling (3.7.2)
- **moment-timezone**: Timezone database (0.6.0)

## 🎯 Other Key Libraries

- **@ducanh2912/next-pwa**: PWA support (10.2.9)
- **browser-image-compression**: Image optimization (2.0.2)
- **sharp**: Server-side image processing (0.34.4)
- **simple-icons**: Brand icons (15.18.0)
- **three**: 3D graphics (0.181.0)

---

# 4. Database Schema

## 📊 Overview

Database menggunakan **PostgreSQL** via Supabase dengan **33 tables** yang terorganisir dalam beberapa kategori.

## 🗂️ Table Categories

### 1. Core Tables (4 tables)
- `organizations` - Data organisasi/perusahaan
- `organization_settings` - Pengaturan per organisasi
- `user_profiles` - Profile user global
- `organization_members` - Karyawan dalam organisasi

### 2. RBAC Tables (5 tables)
- `system_roles` - Role sistem (Super Admin, Admin Org, User)
- `permissions` - Daftar permission
- `role_permissions` - Mapping role ke permission
- `organization_member_roles` - Role member dalam org
- `user_roles` - Role user global

### 3. Organization Structure (2 tables)
- `departments` - Departemen/divisi
- `positions` - Jabatan/posisi

### 4. Attendance Tables (3 tables)
- `attendance_records` - Record kehadiran utama
- `attendance_logs` - Log detail kehadiran
- `attendance_devices` - Device untuk attendance

### 5. Schedule Tables (5 tables)
- `work_schedules` - Template jadwal kerja
- `work_schedule_details` - Detail jadwal per hari
- `shifts` - Shift kerja
- `shift_assignments` - Assignment shift ke member
- `member_schedules` - Jadwal member

### 6. Leave Management (3 tables)
- `leave_types` - Jenis cuti
- `leave_requests` - Request cuti
- `leave_approvals` - Approval cuti

### 7. Other Tables (11 tables)
- `organization_holidays` - Hari libur organisasi
- `overtime_rules` - Aturan lembur
- `overtime_requests` - Request lembur
- `rfid_cards` - Kartu RFID
- `audit_logs` - Log audit sistem
- `notification_templates` - Template notifikasi
- `notifications` - Notifikasi user
- `applications` - API applications
- `machines` - Mesin attendance
- `firmware_versions` - Versi firmware
- `member_invitations` - Undangan member

## 📋 Key Tables Detail

### Table: `organizations`

Menyimpan data organisasi/perusahaan yang menggunakan sistem.

```sql
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  code VARCHAR UNIQUE NOT NULL,              -- Kode unik organisasi
  name VARCHAR NOT NULL,                     -- Nama organisasi
  legal_name VARCHAR,                        -- Nama legal
  tax_id VARCHAR,                            -- NPWP/Tax ID
  industry VARCHAR,                          -- Industri
  size_category VARCHAR,                     -- Ukuran (small, medium, large)
  timezone VARCHAR DEFAULT 'UTC',            -- Timezone
  currency_code CHAR(3) DEFAULT 'USD',       -- Mata uang
  country_code CHAR(2) NOT NULL,             -- Kode negara
  address TEXT,                              -- Alamat lengkap
  city VARCHAR,
  state_province VARCHAR,
  postal_code VARCHAR,
  phone VARCHAR,
  email VARCHAR,                             -- Email organisasi
  website VARCHAR,
  logo_url VARCHAR,                          -- URL logo
  is_active BOOLEAN DEFAULT TRUE,            -- Status aktif
  is_suspended BOOLEAN DEFAULT FALSE,        -- Suspended by admin
  subscription_tier VARCHAR,                 -- Tier subscription
  subscription_expires_at TIMESTAMPTZ,       -- Expiry date
  inv_code VARCHAR UNIQUE,                   -- Invite code
  description VARCHAR,
  time_format TEXT DEFAULT '24h',            -- Format waktu (12h/24h)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

**Relationships**:
- One-to-Many dengan `organization_members`
- One-to-Many dengan `departments`
- One-to-Many dengan `work_schedules`
- One-to-One dengan `organization_settings`

### Table: `user_profiles`

Profile user yang terhubung dengan Supabase Auth.

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id), -- FK ke Supabase Auth
  employee_code VARCHAR,                   -- Kode karyawan
  first_name VARCHAR NOT NULL,             -- Nama depan
  middle_name VARCHAR,                     -- Nama tengah
  last_name VARCHAR NOT NULL,              -- Nama belakang
  display_name VARCHAR,                    -- Nama display
  email TEXT,                              -- Email
  phone VARCHAR,                           -- Telepon
  mobile VARCHAR,                          -- Mobile
  date_of_birth DATE,                      -- Tanggal lahir
  gender VARCHAR,                          -- male, female, other
  nationality VARCHAR,                     -- Kewarganegaraan
  national_id VARCHAR,                     -- NIK/KTP
  profile_photo_url VARCHAR,               -- URL foto
  emergency_contact JSONB,                 -- Kontak darurat (JSON)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

**JSONB Structure (`emergency_contact`)**:
```json
{
  "name": "John Doe",
  "relationship": "Spouse",
  "phone": "+62812345678",
  "alternativePhone": "+62898765432"
}
```

### Table: `organization_members`

Karyawan yang tergabung dalam organisasi.

```sql
CREATE TABLE organization_members (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  employee_id VARCHAR,                     -- ID karyawan custom
  department_id INTEGER REFERENCES departments(id),
  position_id INTEGER REFERENCES positions(id),
  role_id INTEGER REFERENCES system_roles(id), -- Role dalam org
  direct_manager_id INTEGER REFERENCES organization_members(id),
  hire_date DATE NOT NULL,                 -- Tanggal masuk
  probation_end_date DATE,                 -- Akhir probation
  contract_type VARCHAR,                   -- permanent, contract, internship
  employment_status VARCHAR DEFAULT 'active', -- active, probation, terminated
  termination_date DATE,
  work_location VARCHAR,                   -- Lokasi kerja
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Relationships**:
- Many-to-One dengan `organizations`
- Many-to-One dengan `user_profiles`
- Many-to-One dengan `departments`
- Many-to-One dengan `positions`
- Self-referencing untuk `direct_manager_id`

### Table: `system_roles`

Role sistem untuk RBAC.

```sql
CREATE TABLE system_roles (
  id SERIAL PRIMARY KEY,
  code VARCHAR UNIQUE NOT NULL,            -- SUPER_ADMIN, ADMIN_ORG, USER
  name VARCHAR NOT NULL,                   -- Display name
  description TEXT,
  priority INTEGER DEFAULT 0,              -- Priority level
  is_system BOOLEAN DEFAULT FALSE,         -- System role (tidak bisa dihapus)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Default Roles**:
1. **SUPER_ADMIN** - Full akses sistem (priority: 100)
2. **ADMIN_ORG** - Admin organisasi (priority: 50)
3. **USER** - Employee biasa (priority: 10)

### Table: `permissions`

Daftar permission untuk RBAC.

```sql
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  module VARCHAR,                          -- members, attendance, analytics, etc
  resource VARCHAR,                        -- member, schedule, report
  action VARCHAR,                          -- create, read, update, delete
  code VARCHAR NOT NULL,                   -- members:member:create
  name VARCHAR NOT NULL,                   -- Display name
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Permission Format**: `{module}:{resource}:{action}`

**Contoh Permissions**:
- `members:member:create` - Create member
- `members:member:read` - Read member data
- `attendance:record:create` - Create attendance record
- `analytics:dashboard:read` - View analytics dashboard

**Total Permissions**: 37+ permissions

### Table: `role_permissions`

Mapping role ke permission.

```sql
CREATE TABLE role_permissions (
  role_id INTEGER NOT NULL REFERENCES system_roles(id),
  permission_id INTEGER NOT NULL REFERENCES permissions(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);
```

### Table: `departments`

Departemen/divisi dalam organisasi.

```sql
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  code VARCHAR NOT NULL,                   -- Kode departemen
  name VARCHAR NOT NULL,                   -- Nama departemen
  parent_department_id INTEGER REFERENCES departments(id),
  head_member_id INTEGER REFERENCES organization_members(id),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `positions`

Jabatan/posisi dalam organisasi.

```sql
CREATE TABLE positions (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  code VARCHAR NOT NULL,                   -- Kode posisi
  name VARCHAR NOT NULL,                   -- Nama posisi
  level INTEGER DEFAULT 1,                 -- Level jabatan
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `attendance_records`

Record kehadiran karyawan (table utama).

```sql
CREATE TABLE attendance_records (
  id SERIAL PRIMARY KEY,
  organization_member_id INTEGER NOT NULL REFERENCES organization_members(id),
  application_id INTEGER REFERENCES applications(id),
  attendance_date DATE NOT NULL,           -- Tanggal kehadiran
  status VARCHAR NOT NULL,                 -- present, late, absent, leave, excused
  scheduled_check_in TIME,                 -- Jadwal check-in
  scheduled_check_out TIME,                -- Jadwal check-out
  actual_check_in TIMESTAMPTZ,             -- Actual check-in
  actual_check_out TIMESTAMPTZ,            -- Actual check-out
  late_minutes INTEGER DEFAULT 0,          -- Menit terlambat
  early_leave_minutes INTEGER DEFAULT 0,   -- Menit pulang awal
  work_duration_minutes INTEGER,           -- Durasi kerja (menit)
  overtime_minutes INTEGER DEFAULT 0,      -- Lembur (menit)
  notes TEXT,                              -- Catatan
  check_in_location JSONB,                 -- Lokasi check-in (lat, lng, address)
  check_out_location JSONB,                -- Lokasi check-out
  validated_by UUID REFERENCES user_profiles(id),
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**JSONB Structure (`check_in_location`)**:
```json
{
  "latitude": -6.200000,
  "longitude": 106.816666,
  "address": "Jakarta, Indonesia",
  "accuracy": 10
}
```

**Status Values**:
- `present` - Hadir tepat waktu
- `late` - Hadir terlambat
- `absent` - Tidak hadir
- `leave` - Cuti
- `excused` - Izin

### Table: `work_schedules`

Template jadwal kerja.

```sql
CREATE TABLE work_schedules (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  name VARCHAR NOT NULL,                   -- Nama jadwal
  schedule_type VARCHAR NOT NULL,          -- fixed, rotating, flexible
  default_check_in TIME,                   -- Default check-in time
  default_check_out TIME,                  -- Default check-out time
  grace_period_minutes INTEGER DEFAULT 0,  -- Toleransi keterlambatan
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Schedule Types**:
- `fixed` - Jadwal tetap setiap hari
- `rotating` - Jadwal berputar (shift)
- `flexible` - Jadwal fleksibel

### Table: `work_schedule_details`

Detail jadwal per hari.

```sql
CREATE TABLE work_schedule_details (
  id SERIAL PRIMARY KEY,
  work_schedule_id INTEGER NOT NULL REFERENCES work_schedules(id),
  day_of_week INTEGER NOT NULL,            -- 0=Sunday, 6=Saturday
  check_in_time TIME NOT NULL,
  check_out_time TIME NOT NULL,
  break_duration_minutes INTEGER DEFAULT 0,
  is_working_day BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `member_schedules`

Assignment jadwal ke member.

```sql
CREATE TABLE member_schedules (
  id SERIAL PRIMARY KEY,
  organization_member_id INTEGER NOT NULL REFERENCES organization_members(id),
  work_schedule_id INTEGER NOT NULL REFERENCES work_schedules(id),
  effective_date DATE NOT NULL,            -- Tanggal mulai berlaku
  end_date DATE,                           -- Tanggal akhir (null = ongoing)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `member_invitations`

Undangan untuk member baru join organisasi.

```sql
CREATE TABLE member_invitations (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  email VARCHAR NOT NULL,                  -- Email invitee
  invited_by UUID NOT NULL REFERENCES user_profiles(id),
  role_id INTEGER REFERENCES system_roles(id),
  department_id INTEGER REFERENCES departments(id),
  position_id INTEGER REFERENCES positions(id),
  invitation_token UUID UNIQUE DEFAULT gen_random_uuid(),
  status VARCHAR DEFAULT 'pending',        -- pending, accepted, expired, cancelled
  message TEXT,                            -- Pesan undangan
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔗 Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│  organizations  │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────┴───────────────┐
│                        │
│  organization_members  │◄───┐
└────────┬───────────────┘    │
         │                    │ Self-ref
         │ N:1                │ (manager)
         │                    │
┌────────┴────────┐           │
│                 │           │
│  user_profiles  │           │
└────────┬────────┘           │
         │                    │
         │ 1:N                │
         │                    │
┌────────┴──────────────┐     │
│                       │     │
│  attendance_records   │     │
└───────────────────────┘     │
                              │
┌────────────────┐            │
│  departments   │◄───────────┘
└────────┬───────┘
         │
         │ 1:N
         │
┌────────┴────────┐
│   positions     │
└─────────────────┘

┌─────────────────┐
│  system_roles   │
└────────┬────────┘
         │
         │ N:M
         │
┌────────┴────────────┐
│                     │
│  role_permissions   │
└────────┬────────────┘
         │
         │ N:M
         │
┌────────┴────────┐
│  permissions    │
└─────────────────┘
```

## 🔑 Indexes

Indexes penting untuk performa:

```sql
-- organization_members
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_dept ON organization_members(department_id);

-- attendance_records
CREATE INDEX idx_attendance_member ON attendance_records(organization_member_id);
CREATE INDEX idx_attendance_date ON attendance_records(attendance_date);
CREATE INDEX idx_attendance_status ON attendance_records(status);

-- member_schedules
CREATE INDEX idx_member_schedules_member ON member_schedules(organization_member_id);
CREATE INDEX idx_member_schedules_effective ON member_schedules(effective_date);
```

## 🛡️ Row Level Security (RLS)

⚠️ **Important**: Saat ini RLS **DISABLED** pada semua tables untuk development. 

**Production Recommendation**: Enable RLS dengan policies:

```sql
-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Policy: User can only see members in their organization
CREATE POLICY "Users see own org members" ON organization_members
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );
```

---

# 5. API Routes

## 📡 Overview

Aplikasi memiliki **30+ API endpoints** yang diorganisir dalam folder `/src/app/api/`.

Semua API menggunakan:
- **Authentication**: Supabase Auth (JWT)
- **Authorization**: Role-based permissions
- **Format Response**: JSON
- **Error Handling**: Consistent error format

## 📚 API Categories

### 1. Members API (8 endpoints)

#### `GET /api/members`
List semua members dalam organisasi.

**Query Parameters**:
- `organizationId` (required): ID organisasi
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employee_id": "EMP001",
      "user_id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "department_name": "Engineering",
      "position_name": "Senior Developer",
      "hire_date": "2024-01-01",
      "employment_status": "active"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### `POST /api/members/create`
Buat member baru dalam organisasi.

**Request Body**:
```json
{
  "organizationId": 1,
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "departmentId": 2,
  "positionId": 5,
  "hireDate": "2024-06-01",
  "employeeId": "EMP002"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "employee_id": "EMP002",
    "created_at": "2024-06-01T10:00:00Z"
  }
}
```

#### `PUT /api/members/update`
Update data member.

**Request Body**:
```json
{
  "memberId": 2,
  "firstName": "Jane Updated",
  "departmentId": 3,
  "positionId": 6
}
```

#### `POST /api/members/invite`
Kirim undangan member baru via email.

**Request Body**:
```json
{
  "organizationId": 1,
  "email": "invite@example.com",
  "roleId": 3,
  "departmentId": 2,
  "positionId": 5,
  "message": "Welcome to our team!"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "invitationToken": "uuid-token",
    "expiresAt": "2024-06-08T10:00:00Z"
  }
}
```

#### `POST /api/members/accept-invite`
Accept invitation (digunakan oleh invitee).

**Request Body**:
```json
{
  "token": "uuid-token",
  "userId": "user-uuid"
}
```

#### `GET /api/members/init`
Initialize members data untuk dropdown/select.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "label": "John Doe (EMP001)",
      "value": "1"
    }
  ]
}
```

#### `GET /api/members/capabilities`
Get member capabilities dan permissions.

**Query Parameters**:
- `userId`: User UUID

**Response**:
```json
{
  "success": true,
  "data": {
    "permissions": ["members:member:read", "attendance:record:create"],
    "role": "ADMIN_ORG",
    "organizationId": 1
  }
}
```

#### `GET /api/members/auth/[userId]`
Get auth info untuk specific user.

### 2. Attendance API (5 endpoints)

#### `GET /api/attendance/today`
Get attendance records untuk hari ini.

**Query Parameters**:
- `organizationId` (required)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 100,
      "member_name": "John Doe",
      "employee_id": "EMP001",
      "status": "present",
      "actual_check_in": "2024-06-01T08:00:00Z",
      "actual_check_out": "2024-06-01T17:00:00Z",
      "late_minutes": 0,
      "work_duration_minutes": 480
    }
  ]
}
```

#### `POST /api/attendance/init`
Initialize attendance record (check-in).

**Request Body**:
```json
{
  "organizationMemberId": 1,
  "attendanceDate": "2024-06-01",
  "actualCheckIn": "2024-06-01T08:05:00Z",
  "checkInLocation": {
    "latitude": -6.200000,
    "longitude": 106.816666,
    "address": "Jakarta, Indonesia"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 101,
    "status": "late",
    "late_minutes": 5
  }
}
```

#### `GET /api/attendance/group`
Get attendance grouped by department/position.

#### `GET /api/attendance-records`
Get attendance records dengan filter.

**Query Parameters**:
- `organizationId` (required)
- `startDate` (optional)
- `endDate` (optional)
- `memberId` (optional)
- `status` (optional)

#### `POST /api/batch`
Batch operations untuk attendance (bulk import).

### 3. Dashboard API (10 endpoints)

#### `GET /api/dashboard/stats`
Get dashboard statistics overview.

**Response**:
```json
{
  "success": true,
  "data": {
    "totalMembers": 50,
    "activeMembers": 48,
    "presentToday": 45,
    "absentToday": 3,
    "lateToday": 5,
    "attendanceRate": 90.0
  }
}
```

#### `GET /api/dashboard/today-summary`
Summary untuk hari ini.

#### `GET /api/dashboard/recent-activity`
Recent attendance activities.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 100,
      "member_name": "John Doe",
      "action": "check_in",
      "timestamp": "2024-06-01T08:00:00Z",
      "status": "present"
    }
  ]
}
```

#### `GET /api/dashboard/monthly`
Monthly attendance statistics.

#### `GET /api/dashboard/monthly-late`
Monthly late statistics.

#### `GET /api/dashboard/monthly-trend`
Monthly attendance trend.

#### `GET /api/dashboard/department-comparison`
Compare attendance by department.

#### `GET /api/dashboard/member-distribution`
Member distribution by department.

#### `GET /api/dashboard/active-members`
List active members.

#### `GET /api/dashboard/active-rfid`
List active RFID cards.

#### `GET /api/dashboard/total-attendance`
Total attendance count.

### 4. Schedule API (3 endpoints)

#### `GET /api/schedules/init`
Initialize schedules data.

#### `GET /api/work-schedules`
Get work schedules.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Regular Office Hours",
      "schedule_type": "fixed",
      "default_check_in": "08:00:00",
      "default_check_out": "17:00:00",
      "grace_period_minutes": 15
    }
  ]
}
```

#### `GET /api/member-schedules`
Get member schedules.

**Query Parameters**:
- `memberId` (optional)
- `date` (optional)

#### `GET /api/member-schedules/init`
Initialize member schedules.

### 5. Organization API (2 endpoints)

#### `GET /api/organization/info`
Get organization info.

**Query Parameters**:
- `organizationId` (required)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "ORG001",
    "name": "Acme Corporation",
    "timezone": "Asia/Jakarta",
    "time_format": "24h",
    "is_active": true
  }
}
```

### 6. Other APIs (5 endpoints)

#### `GET /api/positions`
Get positions list.


#### `GET /api/groups`
Get groups (departments).

#### `POST /api/log-client-error`
Log client-side errors untuk monitoring.


**Request Body**:
```json
{
  "message": "Error message",
  "stack": "Stack trace",
  "url": "/current/url",
  "userAgent": "Browser info"
}
```

#### `GET /api/analytics`
Get analytics data.

## 🔐 Authentication

Semua API routes memerlukan authentication kecuali yang public.

**Headers**:
```
Authorization: Bearer <supabase-jwt-token>
```

Token JWT didapat dari Supabase Auth setelah login.

## ⚠️ Error Handling

Consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common Error Codes**:
- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - No permission
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input
- `SERVER_ERROR` - Internal server error

---

# 6. Folder Structure

## 📁 Project Structure

```
presensi/
├── public/                      # Static assets
│   ├── icons/                   # PWA icons
│   ├── sw.js                    # Service worker
│   └── manifest.json            # PWA manifest
│
├── src/                         # Source code
│   ├── app/                     # Next.js App Router
│   │   ├── api/                 # API routes (30+ endpoints)
│   │   │   ├── members/         # Members API
│   │   │   ├── attendance/      # Attendance API
│   │   │   ├── dashboard/       # Dashboard API
│   │   │   └── ...
│   │   │
│   │   ├── (dashboard)/         # Dashboard layout group
│   │   │   └── layout.tsx       # Dashboard layout
│   │   │
│   │   ├── analytics/           # Analytics pages
│   │   │   └── page.tsx
│   │   │
│   │   ├── attendance/          # Attendance pages
│   │   │   ├── page.tsx         # List attendance
│   │   │   ├── add/             # Add attendance
│   │   │   ├── check-in/        # Check-in page
│   │   │   └── locations/       # Attendance locations
│   │   │
│   │   ├── members/             # Members management
│   │   │   ├── page.tsx         # List members
│   │   │   ├── add/             # Add member
│   │   │   ├── edit/[id]/       # Edit member
│   │   │   └── [id]/            # Member detail
│   │   │
│   │   ├── auth/                # Authentication pages
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── callback/        # OAuth callback
│   │   │
│   │   ├── schedule/            # Schedule management
│   │   ├── group/               # Departments
│   │   ├── position/            # Positions
│   │   ├── role/                # Roles & permissions
│   │   ├── users/               # User management
│   │   ├── organization/        # Org settings
│   │   ├── onboarding/          # Onboarding flow
│   │   ├── offline/             # Offline page (PWA)
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home/landing
│   │   ├── loading.tsx          # Loading state
│   │   └── global-error.tsx     # Error boundary
│   │
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...              # 50+ UI components
│   │   │
│   │   ├── dashboard/           # Dashboard components
│   │   │   ├── dashboard-skeleton.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── live-attendance-table.tsx
│   │   │   └── ...
│   │   │
│   │   ├── forms/               # Form components
│   │   │   ├── account-form.tsx
│   │   │   ├── attendance-form.tsx
│   │   │   ├── members-form.tsx
│   │   │   └── ...
│   │   │
│   │   ├── attendance/          # Attendance components
│   │   ├── members/             # Members components
│   │   ├── analytics/           # Analytics components
│   │   ├── layout/              # Layout components
│   │   ├── admin-panel/         # Admin panel components
│   │   ├── providers/           # Context providers
│   │   └── ...                  # 100+ components
│   │
│   ├── action/                  # Server actions
│   │   ├── account.ts           # Account actions
│   │   ├── analytics.ts         # Analytics actions
│   │   ├── attendance.ts        # Attendance actions
│   │   ├── dashboard.ts         # Dashboard actions
│   │   ├── members.ts           # Members actions
│   │   ├── organization.ts      # Organization actions
│   │   ├── schedule.ts          # Schedule actions
│   │   └── ...                  # 25+ action files
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-analytics.ts     # Analytics hook
│   │   ├── use-auth-cache-clear.ts
│   │   ├── use-dashboard-stats.ts
│   │   ├── use-members.ts       # Members hook
│   │   ├── use-organization-data.ts
│   │   ├── use-session.ts       # Auth session
│   │   ├── use-monitoring.ts    # Error monitoring
│   │   └── ...                  # 20+ hooks
│   │
│   ├── lib/                     # Utilities & helpers
│   │   ├── utils.ts             # General utilities
│   │   ├── rbac.ts              # RBAC utilities
│   │   ├── logger.ts            # Logging system
│   │   ├── timezone.ts          # Timezone utilities
│   │   ├── email.ts             # Email utilities
│   │   ├── data-cache.ts        # Caching utilities
│   │   ├── rate-limit.ts        # Rate limiting
│   │   ├── metadata.ts          # SEO metadata
│   │   ├── menu-list.ts         # Navigation menu
│   │   ├── avatar-utils.ts      # Avatar utilities
│   │   ├── image-compression.ts # Image compression
│   │   └── constants/           # Constants
│   │       └── industries.ts
│   │
│   ├── utils/                   # More utilities
│   │   ├── supabase/            # Supabase clients
│   │   │   ├── client.ts        # Browser client
│   │   │   ├── server.ts        # Server client
│   │   │   └── admin.ts         # Admin client
│   │   ├── cookie-helper.ts
│   │   ├── date-range.ts
│   │   ├── debounce.ts
│   │   ├── format-time.ts
│   │   ├── get-user-org.ts
│   │   ├── image-utils.ts
│   │   ├── logout-handler.ts
│   │   └── timezone.ts
│   │
│   ├── store/                   # Zustand stores
│   │   ├── org-store.ts         # Organization state
│   │   ├── user-store.ts        # User state
│   │   └── time-format-store.ts # Time format state
│   │
│   ├── types/                   # TypeScript types
│   │   └── image-compression.ts
│   │
│   ├── interface/               # TypeScript interfaces
│   │   └── index.ts             # All interfaces
│   │
│   ├── constants/               # App constants
│   │   ├── index.ts
│   │   ├── attendance-status.ts
│   │   └── member-options.ts
│   │
│   ├── config/                  # Configuration
│   │   └── supabase-config.ts
│   │
│   └── middleware.ts            # Next.js middleware
│
├── supabase/                    # Supabase related
│   ├── migrations/              # Database migrations
│   └── config.toml              # Supabase config
│
├── docs/                        # Documentation
│   └── DOCUMENTATION.md         # This file
│
├── .env                         # Environment variables
├── .env.production.local        # Production env
├── .gitignore                   # Git ignore
├── package.json                 # Dependencies
├── pnpm-lock.yaml               # Lock file
├── tsconfig.json                # TypeScript config
├── next.config.mjs              # Next.js config
├── tailwind.config.ts           # TailwindCSS config
├── components.json              # shadcn/ui config
├── eslint.config.mjs            # ESLint config
├── vitest.config.ts             # Vitest config
├── Dockerfile                   # Docker config
└── README.md                    # Project readme
```

## 📂 Key Folders Explained

### `/src/app`
- **Next.js App Router** dengan file-based routing
- Setiap folder = route
- `page.tsx` = Page component
- `layout.tsx` = Layout wrapper
- `loading.tsx` = Loading state
- `error.tsx` = Error boundary

### `/src/components`
- **Reusable components**
- `ui/` = shadcn/ui primitives
- Feature folders = organized by feature

### `/src/action`
- **Server Actions** untuk database operations
- Alternative ke API routes
- Direct database access dengan type safety

### `/src/hooks`
- **Custom React Hooks**
- Reusable logic
- State management helpers

### `/src/lib`
- **Utility functions**
- Business logic
- Helper functions

---

# 7. Architecture

## 🏗️ System Architecture

### Overview

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ HTTPS
       ▼
┌──────────────────────────────────┐
│       Next.js Application        │
│  ┌────────────────────────────┐  │
│  │      App Router Pages      │  │
│  └────────────┬───────────────┘  │
│               │                   │
│  ┌────────────┴───────────────┐  │
│  │    React Components        │  │
│  └────────┬──────┬────────────┘  │
│           │      │                │
│  ┌────────┴──┐ ┌─┴────────────┐  │
│  │ API Routes│ │Server Actions│  │
│  └────────┬──┘ └─┬────────────┘  │
│           │      │                │
│           └──────┼────────────┐   │
│                  │            │   │
└──────────────────┼────────────┼───┘
                   │            │
                   ▼            ▼
        ┌───────────────────────────┐
        │      Supabase Cloud       │
        │  ┌─────────────────────┐  │
        │  │    PostgreSQL       │  │
        │  └─────────────────────┘  │
        │  ┌─────────────────────┐  │
        │  │    Auth Service     │  │
        │  └─────────────────────┘  │
        │  ┌─────────────────────┐  │
        │  │  Storage (Images)   │  │
        │  └─────────────────────┘  │
        │  ┌─────────────────────┐  │
        │  │    Realtime         │  │
        │  └─────────────────────┘  │
        └───────────────────────────┘
```

## 🔄 Data Flow

### 1. Read Data Flow (Query)

```
User Action
    ↓
React Component
    ↓
TanStack Query (useQuery)
    ↓
Server Action / API Route
    ↓
Supabase Client
    ↓
PostgreSQL Database
    ↓
Response → Cache → UI Update
```

### 2. Write Data Flow (Mutation)

```
User Action (Form Submit)
    ↓
React Component
    ↓
TanStack Query (useMutation)
    ↓
Server Action / API Route
    ↓
Validation (Zod Schema)
    ↓
Supabase Client
    ↓
PostgreSQL Database
    ↓
Response → Invalidate Cache → Refetch → UI Update
```

### 3. Authentication Flow

```
User Login
    ↓
Login Form
    ↓
Supabase Auth signInWithPassword()
    ↓
JWT Token Generated
    ↓
Token Stored in HTTP-only Cookie
    ↓
Middleware validates token on each request
    ↓
User redirected to Dashboard
```

## 🎨 Frontend Architecture

### Component Hierarchy

```
App Layout
└── Navigation (Sidebar + TopBar)
    └── Page Layout
        └── Page Content
            ├── Data Table
            │   ├── Filters
            │   ├── Table
            │   └── Pagination
            │
            ├── Form
            │   ├── Input Fields
            │   ├── Validation
            │   └── Submit Button
            │
            └── Charts
                └── Recharts Components
```

### State Management Strategy

**Server State** (TanStack Query):
- API data
- Database records
- Cached queries
- Automatic refetch

**Client State** (Zustand):
- UI state
- User preferences
- Temporary data
- Non-persistent state

**URL State** (Next.js Router):
- Current page
- Filters
- Search params
- Navigation state

## 🔐 Security Architecture

### Layers of Security

1. **Network Layer**
   - HTTPS only
   - CSP headers
   - CORS configuration

2. **Authentication Layer**
   - Supabase Auth
   - JWT tokens
   - HTTP-only cookies
   - Refresh token rotation

3. **Authorization Layer**
   - RBAC implementation
   - Permission checks
   - Middleware validation
   - Server-side enforcement

4. **Data Layer**
   - Input validation (Zod)
   - SQL injection protection (parameterized queries)
   - XSS protection
   - Rate limiting

## 📦 Caching Strategy

### 1. TanStack Query Cache
- **Default**: 5 minutes stale time
- **Aggressive**: 1 hour for static data
- **Short**: 30 seconds for real-time data

### 2. Service Worker Cache (PWA)
- Static assets: 365 days
- API responses: 24 hours
- Images: 30 days

### 3. Next.js Cache
- Static pages: At build time
- ISR pages: Revalidate interval
- API routes: No cache (default)

## 🔌 API Design Patterns

### RESTful Conventions

```
GET    /api/members          # List all
POST   /api/members/create   # Create new
PUT    /api/members/update   # Update existing
DELETE /api/members/delete   # Delete (soft delete)
GET    /api/members/:id      # Get specific
```

### Response Format

**Success**:
```json
{
  "success": true,
  "data": {...},
  "meta": {...}
}
```

**Error**:
```json
{
  "success": false,
  "error": "Message",
  "code": "ERROR_CODE"
}
```

## 🎯 Design Patterns

### 1. Repository Pattern
Server actions sebagai repository layer yang abstract database operations.

### 2. Hook Pattern
Custom hooks untuk reusable logic dan state management.

### 3. Provider Pattern
Context providers untuk global state (theme, user, org).

### 4. Composition Pattern
Component composition untuk UI flexibility.

### 5. Compound Components
Complex components with sub-components (e.g., DataTable).

---

# 8. Pages & Routes

## 🗺️ Application Routes

Total: **35+ pages**

### Public Routes

| Route | Description |
|-------|-------------|
| `/auth/login` | Login page |
| `/auth/signup` | Signup page |
| `/auth/callback` | OAuth callback |
| `/offline` | Offline page (PWA) |

### Protected Routes

#### Dashboard & Home
| Route | Description | Permission |
|-------|-------------|------------|
| `/` | Landing/Dashboard | Authenticated |
| `/analytics` | Analytics dashboard | `analytics:dashboard:read` |

#### Members Management
| Route | Description | Permission |
|-------|-------------|------------|
| `/members` | List members | `members:member:read` |
| `/members/add` | Add new member | `members:member:create` |
| `/members/edit/[id]` | Edit member | `members:member:update` |
| `/members/[id]` | Member detail | `members:member:read` |

#### Attendance Management
| Route | Description | Permission |
|-------|-------------|------------|
| `/attendance` | Attendance list | `attendance:record:read` |
| `/attendance/add` | Add attendance | `attendance:record:create` |
| `/attendance/check-in` | Check-in page | Self |
| `/attendance/locations` | Manage locations | `attendance:location:read` |
| `/attendance/locations/new` | Add location | `attendance:location:create` |
| `/attendance/locations/[id]` | Edit location | `attendance:location:update` |

#### Schedule Management
| Route | Description | Permission |
|-------|-------------|------------|
| `/schedule` | List schedules | `schedule:template:read` |
| `/schedule/detail/[id]` | Schedule detail | `schedule:template:read` |
| `/member-schedules` | Member schedules | `schedule:assignment:read` |

#### Organization Structure
| Route | Description | Permission |
|-------|-------------|------------|
| `/group` | Departments | `organization:department:read` |
| `/position` | Positions | `organization:position:read` |

#### RBAC
| Route | Description | Permission |
|-------|-------------|------------|
| `/role` | Roles | `rbac:role:read` |
| `/role/role-permission/[id]` | Role permissions | `rbac:role:update` |
| `/permission` | Permissions | `rbac:permission:read` |

#### User & Account
| Route | Description | Permission |
|-------|-------------|------------|
| `/users` | User management | `users:user:read` |
| `/users/edit/[id]` | Edit user | `users:user:update` |
| `/account` | User account settings | Self |

#### Organization
| Route | Description | Permission |
|-------|-------------|------------|
| `/organization/settings` | Org settings | `organization:settings:update` |
| `/onboarding` | Onboarding flow | New org |

#### Invitations & Access
| Route | Description | Permission |
|-------|-------------|------------|
| `/accept-invite` | Accept org invite | Public (with token) |
| `/invite/accept/[token]` | Accept member invite | Public (with token) |
| `/settings/invitations` | Manage invitations | `members:invitation:read` |

#### Leave Management (Upcoming)
| Route | Description | Permission |
|-------|-------------|------------|
| `/leaves` | Leave requests | `leave:request:read` |
| `/leaves/new` | New leave request | `leave:request:create` |

#### Special Pages
| Route | Description |
|-------|-------------|
| `/account-inactive` | Account inactive notice |
| `/organization-inactive` | Org inactive notice |
| `/subscription-expired` | Subscription expired |

## 🛣️ Route Groups

### (dashboard) Layout Group
Semua protected routes menggunakan dashboard layout dengan sidebar + topbar.

**Files**:
- `(dashboard)/layout.tsx` - Dashboard layout wrapper
- `components/admin-panel/` - Layout components

**Features**:
- Persistent sidebar
- Responsive design
- Breadcrumbs
- User menu

### (auth) Layout Group
Authentication pages dengan clean layout.

**Files**:
- `auth/layout.tsx` - Auth layout wrapper

**Features**:
- Centered form
- Brand logo
- No navigation

## 🔀 Redirects

Automatic redirects dikonfigurasi di `next.config.mjs`:

```javascript
{
  source: '/auth',
  destination: '/auth/login',
  permanent: true
}
```

---

# 9. Components

## 🎨 Component Architecture

Aplikasi memiliki **100+ components** yang terorganisir dengan baik.

## 📚 Component Categories

### 1. UI Components (shadcn/ui)

Located in `/src/components/ui/`

**50+ primitive components**:
- `button.tsx` - Button variants
- `card.tsx` - Card container
- `dialog.tsx` - Modal dialog
- `form.tsx` - Form wrapper
- `input.tsx` - Input field
- `select.tsx` - Select dropdown
- `table.tsx` - Data table
- `badge.tsx` - Badge/tag
- `avatar.tsx` - Avatar component
- `checkbox.tsx` - Checkbox
- `radio-group.tsx` - Radio buttons
- `switch.tsx` - Toggle switch
- `slider.tsx` - Range slider
- `tabs.tsx` - Tab navigation
- `accordion.tsx` - Accordion
- `alert.tsx` - Alert messages
- `sheet.tsx` - Side sheet
- `popover.tsx` - Popover
- `tooltip.tsx` - Tooltip
- `calendar.tsx` - Date picker
- `skeleton.tsx` - Loading skeleton
- Dan 30+ lainnya...

**Example Usage**:
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">Click Me</Button>
      </CardContent>
    </Card>
  )
}
```

### 2. Dashboard Components

Located in `/src/components/dashboard/`

- `dashboard-skeleton.tsx` - Loading state
- `empty-state.tsx` - Empty data state
- `live-attendance-table.tsx` - Real-time table
- `recent-activity-feed.tsx` - Activity feed
- `today-summary-hero.tsx` - Today summary card
- `activity-timeline.tsx` - Timeline component
- `department-comparison.tsx` - Dept comparison chart

### 3. Form Components

Located in `/src/components/forms/`

- `account-form.tsx` - Account settings form
- `attendance-form.tsx` - Attendance entry form
- `attendance-form-batch.tsx` - Bulk attendance
- `members-form.tsx` - Member form
- `organization-form.tsx` - Organization form
- `rfid-card-form.tsx` - RFID card form
- `signup-form.tsx` - Signup form

**Example**:
```tsx
import { MembersForm } from "@/components/forms/members-form"

function AddMemberPage() {
  return (
    <MembersForm 
      mode="create"
      onSuccess={(data) => {
        console.log("Member created:", data)
      }}
    />
  )
}
```

### 4. Feature Components

#### Attendance Components
`/src/components/attendance/`
- `attendance-calendar-view.tsx`
- `modern-attendance-list.tsx`
- `modern-check-in.tsx`

#### Members Components
`/src/components/members/`
- `member-profile.tsx` - Member profile card
- `member-profile-client.tsx` - Client-side profile
- `member-grid-cards.tsx` - Grid view
- `modern-profile-card.tsx` - Modern card design
- `recent30-data-table.tsx` - Recent 30 days

#### Analytics Components
`/src/components/analytics/`
- `analytics-filter-bar.tsx` - Filter controls
- `analytics-skeleton.tsx` - Loading state
- `date-filter-bar.tsx` - Date range picker

#### Charts Components
`/src/components/charts/`
- `member-attendance-donut.tsx` - Donut chart

### 5. Layout Components

#### Admin Panel
`/src/components/admin-panel/`
- `admin-panel-layout.tsx` - Main layout
- `sidebar.tsx` - Sidebar navigation
- `navbar.tsx` - Top navbar
- `menu.tsx` - Menu items
- `user-nav.tsx` - User dropdown
- `footer.tsx` - Footer

#### App Layout
`/src/components/layout/`
- `app-navbar.tsx` - App navigation bar
- `app-sidebar.tsx` - App sidebar
- `app-shell.tsx` - Shell wrapper
- `dashboard-layout-wrapper.tsx` - Dashboard wrapper
- `navbar-with-shortcuts.tsx` - Navbar with shortcuts
- `page-transition-wrapper.tsx` - Page transitions

### 6. Utility Components

Located in `/src/components/`

- `data-table.tsx` - Generic data table
- `error-boundary.tsx` - Error boundary
- `mode-toggle.tsx` - Dark mode toggle
- `logout.tsx` - Logout button
- `can.tsx` - Permission checker
- `loading-skeleton.tsx` - Loading skeleton
- `install-prompt.tsx` - PWA install prompt
- `offline-detector.tsx` - Offline status
- `photo-upload-dialog.tsx` - Photo upload
- `change-foto.tsx` - Change photo

### 7. Provider Components

`/src/components/providers/`
- `theme-provider.tsx` - Theme context
- `query-provider.tsx` - TanStack Query
- `user-provider.tsx` - User context
- `timezone-provider.tsx` - Timezone context
- `time-format-provider.tsx` - Time format

### 8. Attendance By Group Table

`/src/components/attendance-by-group-table/`
- `attendance-by-group-table.tsx` - Main table
- `attendance-by-group-columns.tsx` - Table columns

## 🎯 Component Patterns

### 1. Compound Components

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
  <CardFooter>
    Footer actions
  </CardFooter>
</Card>
```

### 2. Render Props

```tsx
<DataTable
  data={members}
  columns={columns}
  renderEmpty={() => <EmptyState />}
/>
```

### 3. Controlled Components

```tsx
<Input
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### 4. Permission-based Rendering

```tsx
import { Can } from "@/components/can"

<Can permission="members:member:create">
  <Button>Add Member</Button>
</Can>
```

## 📝 Component Best Practices

### 1. File Naming
- PascalCase untuk components: `MemberProfile.tsx`
- kebab-case untuk utilities: `use-members.ts`

### 2. Props Interface
```tsx
interface MemberProfileProps {
  member: IOrganization_member
  onEdit?: () => void
  className?: string
}

export function MemberProfile({ 
  member, 
  onEdit,
  className 
}: MemberProfileProps) {
  // Component logic
}
```

### 3. Default Props
```tsx
export function DataTable({
  page = 1,
  limit = 10,
  ...props
}: DataTableProps) {
  // Component logic
}
```

### 4. Client Components
```tsx
"use client" // For components using hooks/state

import { useState } from "react"

export function InteractiveComponent() {
  const [state, setState] = useState()
  // ...
}
```

### 5. Server Components (Default)
```tsx
// No "use client" directive
// Can do async/await directly

export async function DataFetcher() {
  const data = await fetchData()
  return <Display data={data} />
}
```

---

# 10. State Management

## 🔄 State Management Strategy

Aplikasi menggunakan **3 layers** state management:

1. **Server State** - TanStack Query (React Query)
2. **Client State** - Zustand
3. **URL State** - Next.js Router

## 1. Server State (TanStack Query)

### Configuration

`/src/providers/query-provider.tsx`:
```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
```

### Usage Pattern

**Query (Read)**:
```tsx
import { useQuery } from "@tanstack/react-query"
import { getMembers } from "@/action/members"

function MembersList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["members", organizationId],
    queryFn: () => getMembers(organizationId),
    staleTime: 5 * 60 * 1000, // 5 min
  })

  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorState error={error} />
  
  return <MembersTable data={data} />
}
```

**Mutation (Write)**:
```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createMember } from "@/action/members"

function AddMemberForm() {
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: createMember,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ 
        queryKey: ["members"] 
      })
      toast.success("Member created!")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
  
  const handleSubmit = (data) => {
    mutation.mutate(data)
  }
  
  return <Form onSubmit={handleSubmit} />
}
```

### Query Keys Pattern

```tsx
// Pattern: [entity, id?, filters?]
["members"]                       // All members
["members", orgId]                // Members by org
["members", orgId, { dept: 1 }]   // Members filtered
["member", memberId]              // Single member
["attendance", date]              // Attendance by date
["attendance", memberId, date]    // Member attendance
```

### Custom Hooks dengan React Query

`/src/hooks/use-members.ts`:
```tsx
export function useMembers(organizationId: number) {
  return useQuery({
    queryKey: ["members", organizationId],
    queryFn: () => getMembers(organizationId),
    enabled: !!organizationId, // Only run if org exists
  })
}

export function useCreateMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] })
    },
  })
}
```

Usage:
```tsx
function MyComponent() {
  const { data: members } = useMembers(orgId)
  const createMutation = useCreateMember()
  
  // Use directly
}
```

## 2. Client State (Zustand)

### Organization Store

`/src/store/org-store.ts`:
```tsx
import { create } from 'zustand'

interface OrgState {
  organizationId: number | null
  organizationName: string | null
  setOrganization: (id: number, name: string) => void
  clearOrganization: () => void
}

export const useOrgStore = create<OrgState>((set) => ({
  organizationId: null,
  organizationName: null,
  setOrganization: (id, name) => set({ 
    organizationId: id, 
    organizationName: name 
  }),
  clearOrganization: () => set({ 
    organizationId: null, 
    organizationName: null 
  }),
}))
```

Usage:
```tsx
import { useOrgStore } from "@/store/org-store"

function MyComponent() {
  const { organizationId, setOrganization } = useOrgStore()
  
  // Use store state and actions
}
```

### User Store

`/src/store/user-store.ts`:
```tsx
interface UserState {
  userId: string | null
  email: string | null
  role: string | null
  permissions: string[]
  setUser: (user: UserData) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>((set) => ({
  // State and actions
}))
```

### Time Format Store

`/src/store/time-format-store.ts`:
```tsx
interface TimeFormatState {
  format: '12h' | '24h'
  setTimeFormat: (format: '12h' | '24h') => void
}

export const useTimeFormatStore = create<TimeFormatState>((set) => ({
  format: '24h',
  setTimeFormat: (format) => set({ format }),
}))
```

## 3. URL State (Next.js Router)

### Search Params

```tsx
import { useSearchParams, useRouter } from "next/navigation"

function FilteredList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const page = searchParams.get("page") || "1"
  const search = searchParams.get("search") || ""
  
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set(key, value)
    router.push(`?${params.toString()}`)
  }
  
  return (
    <div>
      <Input 
        value={search}
        onChange={(e) => updateFilter("search", e.target.value)}
      />
    </div>
  )
}
```

### Dynamic Routes

```tsx
// app/members/[id]/page.tsx
export default function MemberDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const memberId = params.id
  
  const { data: member } = useQuery({
    queryKey: ["member", memberId],
    queryFn: () => getMember(memberId),
  })
  
  return <MemberProfile member={member} />
}
```

## 🎯 When to Use What?

### Use TanStack Query for:
- ✅ Server data (API, database)
- ✅ Caching
- ✅ Background refetching
- ✅ Optimistic updates
- ✅ Pagination
- ✅ Infinite scroll

### Use Zustand for:
- ✅ UI state (modal open/close)
- ✅ User preferences
- ✅ Temporary data
- ✅ Global client state
- ✅ Cross-component communication

### Use URL State for:
- ✅ Filters
- ✅ Pagination
- ✅ Search queries
- ✅ Active tab
- ✅ Anything that should be shareable via URL

### Use React useState for:
- ✅ Local component state
- ✅ Form inputs (uncontrolled)
- ✅ Temporary UI state
- ✅ State that doesn't need to persist

## 📊 State Flow Diagram

```
┌─────────────────────────────────────┐
│         User Interaction            │
└───────────────┬─────────────────────┘
                │
                ▼
        ┌───────────────┐
        │   Component   │
        └───────┬───────┘
                │
    ┌───────────┼───────────┐
    │           │           │
    ▼           ▼           ▼
┌────────┐ ┌────────┐ ┌────────┐
│  URL   │ │Zustand │ │ Query  │
│ State  │ │ Store  │ │ Cache  │
└────────┘ └────────┘ └───┬────┘
                          │
                          ▼
                  ┌───────────────┐
                  │  Server API   │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │   Database    │
                  └───────────────┘
```

---

# 11. Authentication & Authorization

## 🔐 Authentication

### Supabase Auth Integration

Aplikasi menggunakan **Supabase Auth** dengan JWT tokens.

### Auth Flow

```
1. User login dengan email/password
   ↓
2. Supabase Auth generates JWT token
   ↓
3. Token disimpan di HTTP-only cookie
   ↓
4. Setiap request include token
   ↓
5. Middleware validates token
   ↓
6. Access granted/denied
```

### Supabase Client Setup

**Browser Client** (`/src/utils/supabase/client.ts`):
```tsx
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Server Client** (`/src/utils/supabase/server.ts`):
```tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

### Login Implementation

`/src/app/auth/login/page.tsx`:
```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    
    router.push("/")
    router.refresh()
  }
  
  return (
    <form onSubmit={handleLogin}>
      <Input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input 
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" loading={loading}>
        Login
      </Button>
    </form>
  )
}
```

### Logout Implementation

`/src/components/logout.tsx`:
```tsx
"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

export function Logout() {
  const router = useRouter()
  
  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    
    // Clear all stores
    useOrgStore.getState().clearOrganization()
    useUserStore.getState().clearUser()
    
    router.push("/auth/login")
    router.refresh()
  }
  
  return (
    <Button onClick={handleLogout} variant="ghost">
      Logout
    </Button>
  )
}
```

### Get Current User

**Client Side**:
```tsx
import { useSession } from "@/hooks/use-session"

function MyComponent() {
  const { user, loading } = useSession()
  
  if (loading) return <LoadingSkeleton />
  if (!user) return <LoginPrompt />
  
  return <div>Hello {user.email}</div>
}
```

**Server Side**:
```tsx
import { createClient } from "@/utils/supabase/server"

export default async function ServerComponent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }
  
  return <div>Hello {user.email}</div>
}
```

### Middleware Protection

`/src/middleware.ts`:
```tsx
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Protected routes
  const protectedPaths = ["/", "/members", "/attendance", "/analytics"]
  const isProtected = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )
  
  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## 🛡️ Authorization (RBAC)

### Permission System

**Permission Format**: `{module}:{resource}:{action}`

**Examples**:
- `members:member:create`
- `members:member:read`
- `members:member:update`
- `members:member:delete`
- `attendance:record:create`
- `analytics:dashboard:read`

### Check Permissions

**Utility Function** (`/src/lib/rbac.ts`):
```tsx
export async function checkPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  const supabase = createClient()
  
  // Get user roles
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select(`
      role_id,
      system_roles (
        id,
        code
      )
    `)
    .eq('user_id', userId)
  
  if (!userRoles) return false
  
  // Super Admin has all permissions
  if (userRoles.some(ur => ur.system_roles.code === 'SUPER_ADMIN')) {
    return true
  }
  
  // Check specific permission
  const { data: rolePermissions } = await supabase
    .from('role_permissions')
    .select(`
      permissions (
        code
      )
    `)
    .in('role_id', userRoles.map(ur => ur.role_id))
  
  return rolePermissions?.some(rp => 
    rp.permissions.code === permission
  ) || false
}
```

**Server Component**:
```tsx
import { checkPermission } from "@/lib/rbac"
import { createClient } from "@/utils/supabase/server"

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }
  
  const canCreate = await checkPermission(user.id, "members:member:create")
  
  return (
    <div>
      {canCreate && (
        <Button>Add Member</Button>
      )}
    </div>
  )
}
```

**Client Component** (`Can` wrapper):
```tsx
// /src/components/can.tsx
"use client"

import { useEffect, useState } from "react"
import { useSession } from "@/hooks/use-session"
import { checkPermission } from "@/lib/rbac"

interface CanProps {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { user } = useSession()
  const [hasPermission, setHasPermission] = useState(false)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    
    checkPermission(user.id, permission).then(result => {
      setHasPermission(result)
      setLoading(false)
    })
  }, [user, permission])
  
  if (loading) return null
  if (!hasPermission) return <>{fallback}</>
  
  return <>{children}</>
}
```

Usage:
```tsx
import { Can } from "@/components/can"

function MyComponent() {
  return (
    <Can permission="members:member:create">
      <Button>Add Member</Button>
    </Can>
  )
}
```

### Role Hierarchy

1. **SUPER_ADMIN** (Priority: 100)
   - Full akses ke semua fitur
   - Manage semua organisasi
   - Approve/suspend organisasi

2. **ADMIN_ORG** (Priority: 50)
   - Full akses dalam organisasi sendiri
   - Manage members, departments, schedules
   - View analytics & reports

3. **USER** (Priority: 10)
   - Check-in/out attendance
   - View own data
   - Request leave (upcoming)

### Default Permissions by Role

**SUPER_ADMIN**: All permissions

**ADMIN_ORG**:
- `members:*:*` - All members operations
- `attendance:*:*` - All attendance operations
- `schedule:*:*` - All schedule operations
- `organization:*:read` - Read org data
- `organization:*:update` - Update org data
- `analytics:*:read` - View analytics
- `reports:*:*` - All report operations

**USER**:
- `members:member:read` - Read member data (self)
- `attendance:record:create` - Check-in/out
- `attendance:record:read` - View own attendance
- `schedule:assignment:read` - View own schedule

---

# 12. Development Guide

## 🛠️ Development Workflow

### 1. Starting New Feature

```bash
# Create feature branch
git checkout -b feature/nama-feature

# Start dev server
pnpm dev
```

### 2. Code Organization

**File Structure untuk Feature Baru**:
```
src/
├── app/
│   └── feature-name/        # Pages
│       ├── page.tsx         # Main page
│       └── components/      # Page-specific components
│
├── components/
│   └── feature-name/        # Reusable components
│
├── action/
│   └── feature-name.ts      # Server actions
│
└── hooks/
    └── use-feature-name.ts  # Custom hooks
```

### 3. Creating New Page

```tsx
// src/app/my-page/page.tsx
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export default async function MyPage() {
  // Server-side data fetching
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }
  
  return (
    <div>
      <h1>My Page</h1>
      {/* Content */}
    </div>
  )
}
```

### 4. Creating Server Action

```tsx
// src/action/my-feature.ts
"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function createItem(data: CreateItemInput) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  
  // Insert data
  const { data: item, error } = await supabase
    .from('items')
    .insert({
      ...data,
      user_id: user.id,
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(error.message)
  }
  
  // Revalidate cache
  revalidatePath('/items')
  
  return item
}
```

### 5. Creating API Route

```tsx
// src/app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query params
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    
    // Fetch data
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('id', id)
    
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation
    // Insert data
    // Return response
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
```

### 6. Creating Custom Hook

```tsx
// src/hooks/use-my-feature.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getItems, createItem } from "@/action/my-feature"

export function useItems(filters?: ItemFilters) {
  return useQuery({
    queryKey: ["items", filters],
    queryFn: () => getItems(filters),
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })
}
```

### 7. Creating Component

```tsx
// src/components/my-feature/my-component.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useItems } from "@/hooks/use-my-feature"

interface MyComponentProps {
  id: string
  onSuccess?: () => void
}

export function MyComponent({ id, onSuccess }: MyComponentProps) {
  const { data, isLoading } = useItems({ id })
  
  if (isLoading) return <LoadingSkeleton />
  
  return (
    <div>
      <h2>{data.title}</h2>
      {/* Content */}
    </div>
  )
}
```

## 🎯 Best Practices

### 1. TypeScript
- ✅ Always use TypeScript
- ✅ Define interfaces untuk props
- ✅ Avoid `any` type
- ✅ Use type inference when possible

### 2. Components
- ✅ Keep components small and focused
- ✅ Use compound components pattern
- ✅ Separate logic dengan custom hooks
- ✅ Add "use client" hanya jika perlu

### 3. Data Fetching
- ✅ Use TanStack Query untuk caching
- ✅ Server actions untuk mutations
- ✅ Handle loading & error states
- ✅ Implement optimistic updates

### 4. State Management
- ✅ Use TanStack Query untuk server state
- ✅ Use Zustand untuk global client state
- ✅ Use useState untuk local state
- ✅ Keep state as low as possible

### 5. Performance
- ✅ Use React.memo untuk expensive components
- ✅ Implement pagination untuk large lists
- ✅ Lazy load heavy components
- ✅ Optimize images dengan next/image

### 6. Error Handling
- ✅ Always handle errors
- ✅ Show user-friendly error messages
- ✅ Log errors untuk monitoring
- ✅ Use error boundaries

### 7. Testing
- ✅ Write tests untuk critical paths
- ✅ Test error scenarios
- ✅ Use Vitest untuk unit tests
- ✅ Test API endpoints

## 🧪 Testing

### Run Tests

```bash
pnpm test
```

### Test Example

```tsx
// src/__tests__/utils/format-time.test.ts
import { describe, it, expect } from "vitest"
import { formatTime } from "@/utils/format-time"

describe("formatTime", () => {
  it("formats time correctly in 24h format", () => {
    const result = formatTime("14:30:00", "24h")
    expect(result).toBe("14:30")
  })
  
  it("formats time correctly in 12h format", () => {
    const result = formatTime("14:30:00", "12h")
    expect(result).toBe("2:30 PM")
  })
})
```

## 🔍 Debugging

### Next.js Dev Tools

```tsx
// Enable React DevTools
// Already available in browser

// VS Code debugging
// Create .vscode/launch.json:
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Logging

```tsx
import { logger } from "@/lib/logger"

// Client-side
logger.info("User clicked button", { userId: "123" })
logger.error("Failed to load data", error)

// Server-side (akan masuk ke console)
console.log("Server log", data)
```

## 📦 Building & Deployment

### Build for Production

```bash
# Build
pnpm build

# Test production build locally
pnpm start
```

### Environment Variables

Production memerlukan semua env variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NODE_ENV=production
```

---

# 13. Deployment

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

**Paling mudah dan cepat untuk Next.js projects.**

#### Steps:

1. **Push ke GitHub**
```bash
git push origin main
```

2. **Import ke Vercel**
   - Login ke [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import repository
   - Vercel auto-detect Next.js

3. **Set Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait ~2-3 minutes
   - Done! ✅

#### Auto Deployment:
- `main` branch → Production
- `develop` branch → Preview
- Pull Request → Preview URL

#### Custom Domain:
- Settings → Domains
- Add domain
- Update DNS records

### Option 2: Docker

#### Build Image

```bash
# Build
docker build -t presensi:latest .

# Run
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=xxx \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx \
  -e SUPABASE_SERVICE_ROLE_KEY=xxx \
  presensi:latest
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    restart: unless-stopped
```

Run:
```bash
docker-compose up -d
```

### Option 3: VPS (DigitalOcean, AWS, etc)

#### Prerequisites:
- Node.js 18+ installed
- PM2 for process management
- Nginx as reverse proxy

#### Steps:

1. **Clone repository**
```bash
git clone https://github.com/your-org/presensi.git
cd presensi
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Build**
```bash
pnpm build
```

4. **Setup PM2**
```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start pnpm --name "presensi" -- start

# Save PM2 config
pm2 save
pm2 startup
```

5. **Setup Nginx**
```nginx
# /etc/nginx/sites-available/presensi
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/presensi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

6. **SSL with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🔒 Production Checklist

### Before Deploy:

- [ ] Set `NODE_ENV=production`
- [ ] Configure all environment variables
- [ ] Update Supabase URL ke production
- [ ] Enable RLS policies di database
- [ ] Test build locally (`pnpm build && pnpm start`)
- [ ] Check bundle size (`pnpm analyze`)
- [ ] Verify CORS settings
- [ ] Setup error monitoring (Sentry)
- [ ] Configure analytics (GA, etc)
- [ ] Backup database
- [ ] Setup automated backups

### After Deploy:

- [ ] Test authentication flow
- [ ] Test critical paths
- [ ] Check all pages load correctly
- [ ] Verify API endpoints work
- [ ] Test PWA functionality
- [ ] Check mobile responsive
- [ ] Monitor error logs
- [ ] Setup uptime monitoring
- [ ] Document deployment process
- [ ] Notify team

## 📊 Monitoring

### Vercel Analytics
Built-in analytics untuk traffic & performance.

### Error Tracking
Recommend: **Sentry**

```bash
pnpm add @sentry/nextjs
```

Initialize:
```tsx
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

### Uptime Monitoring
Recommend: **UptimeRobot** (free)

---

# 14. Troubleshooting

## 🐛 Common Issues

### 1. Build Errors

**Error**: `Module not found`

**Solution**:
```bash
# Clear cache
rm -rf .next
rm -rf node_modules
pnpm install
pnpm build
```

**Error**: `TypeScript errors`

**Solution**:
- Check `tsconfig.json`
- Fix type errors
- Run `pnpm build` to see all errors

### 2. Database Connection Issues

**Error**: `Invalid JWT token`

**Solution**:
- Check `.env` file exists
- Verify Supabase credentials
- Check cookie settings in middleware

**Error**: `RLS policy violation`

**Solution**:
- Check RLS policies di Supabase
- Verify user has correct permissions
- Check organization_id matches

### 3. Authentication Issues

**Error**: `User not found after login`

**Solution**:
```tsx
// Clear auth cookies
const supabase = createClient()
await supabase.auth.signOut()

// Clear browser cache
// Try login again
```

**Error**: `Redirect loop`

**Solution**:
- Check middleware.ts
- Verify protected routes configuration
- Check cookies are being set correctly

### 4. Performance Issues

**Problem**: Slow page loads

**Solution**:
- Check TanStack Query cache settings
- Implement pagination
- Optimize images
- Use React.memo untuk expensive components
- Check database indexes

**Problem**: Large bundle size

**Solution**:
```bash
# Analyze bundle
pnpm analyze

# Check what's taking space
# Optimize imports
# Use dynamic imports for heavy components
```

### 5. PWA Issues

**Problem**: Service worker not updating

**Solution**:
- Clear browser cache
- Unregister old service worker
- Hard refresh (Ctrl+Shift+R)

**Problem**: Offline mode not working

**Solution**:
- Check `next.config.mjs` PWA settings
- Verify service worker registered
- Check network tab in DevTools

### 6. Development Issues

**Error**: `Port 3000 already in use`

**Solution**:
```bash
# Kill process on port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Or use different port
pnpm dev -- -p 3001
```

**Error**: `ENOSPC: System limit for number of file watchers reached`

**Solution** (Linux):
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 7. Supabase Issues

**Error**: `relation "table_name" does not exist`

**Solution**:
- Check table name spelling
- Verify table exists in Supabase
- Check schema (public vs other)

**Error**: `permission denied for table`

**Solution**:
- Check RLS policies
- Verify service role key
- Check user permissions

## 🔍 Debugging Tips

### 1. Check Browser Console
- Open DevTools (F12)
- Check Console tab untuk errors
- Check Network tab untuk API calls

### 2. Check Server Logs
```bash
# Development
# Logs appear in terminal where you run pnpm dev

# Production (Vercel)
# Check Vercel dashboard → Functions → Logs

# Production (VPS)
pm2 logs presensi
```

### 3. Check Database
- Login ke Supabase Dashboard
- Go to Table Editor
- Check data
- Go to SQL Editor untuk query

### 4. Use Logger
```tsx
import { logger } from "@/lib/logger"

logger.info("Debug info", { data })
logger.error("Error occurred", error)
```

### 5. React DevTools
- Install React DevTools extension
- Inspect component tree
- Check props & state

## 📞 Getting Help

### Resources:
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **TanStack Query**: https://tanstack.com/query/latest

### Contact:
- Team Lead: [Name]
- Email: [Email]
- Slack: [Channel]
- GitHub Issues: [URL]

---

## 🎉 Conclusion

Dokumentasi ini mencakup semua aspek penting dari aplikasi Presensi. Untuk pertanyaan lebih lanjut atau klarifikasi, silakan hubungi team lead atau buat issue di repository.

**Selamat coding! 🚀**

---

**Document Info**:
- **Created**: 2025-11-17
- **Last Updated**: 2025-11-17
- **Version**: 1.0.0
- **Maintainer**: Development Team
- **Next Review**: 2025-12-17

---

**License**: MIT License - See LICENSE file for details.
