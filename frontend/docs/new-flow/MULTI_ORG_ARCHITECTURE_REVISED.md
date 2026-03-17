# Multi-Organization Architecture - REVISED

## 📋 Daftar Isi
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [User Roles & Responsibilities](#user-roles--responsibilities)
4. [Website vs Mobile App](#website-vs-mobile-app)
5. [Authentication Flow](#authentication-flow)
6. [Attendance Recording Flow](#attendance-recording-flow)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)

---

## Overview

### Sistem Keseluruhan
```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP                               │
│  (User Registration, Face Recognition, Attendance)          │
│                                                              │
│  Role: Petugas (Record faces, capture attendance)           │
│  Role: User/Member (Register face, submit attendance)       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ API Integration
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    WEBSITE                                  │
│  (Management Dashboard Only)                                │
│                                                              │
│  Function: Manage & Display Attendance Data                 │
│  - View attendance records                                  │
│  - Filter & search attendance                               │
│  - Generate reports                                         │
│  - Manage organization settings                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Points
- ✅ **Website HANYA untuk management** - tidak ada login member
- ✅ **Mobile App** - tempat user/member melakukan registrasi dan absensi
- ✅ **Petugas** - role di mobile app yang merekam wajah member
- ✅ **User/Member** - sama, hanya nama berbeda, registrasi wajah di mobile
- ✅ **Website** - menampilkan data attendance yang sudah tercatat dari mobile
- ✅ **Integrasi** - website dan mobile terhubung via API

---

## System Architecture

### High-Level Architecture
```
┌──────────────────────────────────────────────────────────────┐
│                    MOBILE APP                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Face Recognition Module                               │  │
│  │ - Face registration (User/Member)                     │  │
│  │ - Face detection & capture (Petugas)                  │  │
│  │ - Face matching & verification                        │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Attendance Recording Module                           │  │
│  │ - Capture attendance (Petugas)                        │  │
│  │ - Submit attendance (User/Member)                     │  │
│  │ - Store locally & sync with server                    │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ REST API / WebSocket
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                    BACKEND SERVER                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ API Endpoints                                         │  │
│  │ - Face data endpoints                                │  │
│  │ - Attendance endpoints                               │  │
│  │ - Member endpoints                                   │  │
│  │ - Organization endpoints                             │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Database                                              │  │
│  │ - Face data storage                                  │  │
│  │ - Attendance records                                 │  │
│  │ - Member profiles                                    │  │
│  │ - Organization data                                  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ REST API
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                    WEBSITE                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Dashboard                                             │  │
│  │ - View attendance records                            │  │
│  │ - Filter & search                                    │  │
│  │ - Generate reports                                   │  │
│  │ - Manage organization                                │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Admin Panel                                           │  │
│  │ - Manage members                                      │  │
│  │ - Manage roles                                        │  │
│  │ - Manage organization settings                        │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## User Roles & Responsibilities

### Role: Petugas (Officer)
**Location:** Mobile App
**Responsibilities:**
- ✅ Merekam wajah user/member saat absensi
- ✅ Menangkap foto/video wajah untuk face recognition
- ✅ Mencatat attendance dengan data wajah
- ✅ Verifikasi identitas member via face recognition
- ✅ Upload attendance data ke server

**Permissions:**
- `attendance:record:create` - Buat record attendance
- `attendance:record:capture` - Capture face data
- `member:face:view` - Lihat face data member
- `attendance:record:view` - Lihat attendance records

**Tidak bisa:**
- Akses website
- Manage members
- Manage organization

---

### Role: User/Member
**Location:** Mobile App
**Responsibilities:**
- ✅ Registrasi wajah di awal
- ✅ Submit attendance (absensi)
- ✅ Lihat history attendance pribadi
- ✅ Update profil pribadi

**Permissions:**
- `member:face:register` - Registrasi wajah
- `member:face:update` - Update wajah
- `attendance:record:submit` - Submit attendance
- `attendance:record:view:own` - Lihat attendance pribadi

**Tidak bisa:**
- Akses website
- Lihat attendance orang lain
- Manage apapun

---

### Role: Admin Organization (Website)
**Location:** Website
**Responsibilities:**
- ✅ Manage members (import, edit, delete)
- ✅ View semua attendance records
- ✅ Generate reports
- ✅ Manage organization settings
- ✅ Manage roles & permissions

**Permissions:**
- `attendance:record:view` - Lihat semua attendance
- `attendance:record:approve` - Approve attendance
- `member:manage` - Manage members
- `settings:manage` - Manage settings
- `report:generate` - Generate reports

**Tidak bisa:**
- Capture attendance (hanya petugas di mobile)
- Registrasi wajah (hanya member di mobile)

---

### Role: Support/Manager (Website)
**Location:** Website
**Responsibilities:**
- ✅ View attendance records
- ✅ Generate reports
- ✅ Filter & search attendance
- ✅ View member profiles

**Permissions:**
- `attendance:record:view` - Lihat attendance
- `report:generate` - Generate reports
- `member:view` - Lihat member profiles

**Tidak bisa:**
- Manage members
- Manage settings
- Capture attendance

---

## Website vs Mobile App

### Website (Management Dashboard)
```
Fungsi:
- Display attendance data
- Manage organization
- Generate reports
- Filter & search
- View member profiles

Tidak ada:
- Member login
- Face registration
- Attendance capture
- Real-time sync
```

### Mobile App (Operational)
```
Fungsi:
- Face registration (User/Member)
- Face capture (Petugas)
- Attendance recording
- Real-time sync
- Offline support

Tidak ada:
- Management dashboard
- Report generation
- Organization settings
```

### Data Flow
```
Mobile App (Capture)
    ↓
Backend Server (Store)
    ↓
Website (Display & Manage)
```

---

## Authentication Flow

### Website Authentication
```
Admin/Manager Login
    ↓
Select Organization
    ↓
Select Role (Admin, Support, Manager)
    ↓
Dashboard (Role-based access)
```

### Mobile App Authentication
```
User/Member Registration
    ↓
Register Face
    ↓
Login dengan face/PIN
    ↓
Petugas: Capture attendance
User: Submit attendance
    ↓
Sync to Server
```

---

## Attendance Recording Flow

### Petugas Recording Flow (Mobile App)
```
1. Petugas buka aplikasi mobile
   ↓
2. Pilih lokasi/departemen
   ↓
3. Scan/search member
   ↓
4. Capture wajah member
   ↓
5. Face recognition verification
   ↓
6. Confirm attendance
   ↓
7. Record saved locally
   ↓
8. Sync to server
   ↓
9. Data muncul di website
```

### User/Member Submission Flow (Mobile App)
```
1. Member buka aplikasi mobile
   ↓
2. Tap "Absensi"
   ↓
3. Face recognition (verify identity)
   ↓
4. Capture wajah untuk attendance
   ↓
5. Add remarks (optional)
   ↓
6. Submit attendance
   ↓
7. Confirmation
   ↓
8. Data sync to server
   ↓
9. Data muncul di website
```

### Website Display Flow
```
Attendance Data (from Mobile)
    ↓
Backend Server (Store)
    ↓
Website API
    ↓
Dashboard Display
    ↓
Admin/Manager View
```

---

## Database Schema

### Key Tables

#### 1. organization_members
```sql
id
user_id (FK → users)
organization_id (FK → organizations)
department_id (FK → departments)
position_id (FK → positions)
status (active, inactive)
created_at
updated_at
```

#### 2. member_face_data (NEW)
```sql
id
organization_member_id (FK → organization_members)
face_encoding (BYTEA) -- Face vector/embedding
face_image_url (TEXT) -- URL to face image
face_registered_at (TIMESTAMP)
face_verified (BOOLEAN)
created_at
updated_at
```

#### 3. attendance_records
```sql
id
organization_id (FK → organizations)
organization_member_id (FK → organization_members)
recorded_by (FK → organization_members) -- Petugas yang record
attendance_date (DATE)
check_in_time (TIME)
check_out_time (TIME)
face_image_url (TEXT) -- Face image saat absensi
face_match_score (FLOAT) -- Confidence score
status (present, late, absent, excused)
remarks (TEXT)
source (mobile, website, manual) -- Dari mana data berasal
created_at
updated_at
```

#### 4. attendance_sync_logs (NEW)
```sql
id
organization_id (FK → organizations)
mobile_device_id (TEXT)
last_sync_at (TIMESTAMP)
sync_status (pending, completed, failed)
records_synced (INT)
created_at
updated_at
```

---

## API Endpoints

### Face Data Endpoints (Mobile ↔ Backend)

#### POST /api/members/:memberId/face/register
**Register face data**
```json
Request:
{
  "face_encoding": "base64_encoded_face_vector",
  "face_image": "base64_encoded_image",
  "device_id": "mobile_device_id"
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "face_registered_at": "2024-12-03T10:00:00Z",
    "face_verified": true
  }
}
```

#### PUT /api/members/:memberId/face/update
**Update face data**
```json
Request:
{
  "face_encoding": "base64_encoded_face_vector",
  "face_image": "base64_encoded_image"
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "updated_at": "2024-12-03T10:00:00Z"
  }
}
```

#### POST /api/face/verify
**Verify face (for login/attendance)**
```json
Request:
{
  "face_encoding": "base64_encoded_face_vector",
  "organization_id": 1
}

Response:
{
  "success": true,
  "data": {
    "member_id": 1,
    "member_name": "John Doe",
    "match_score": 0.95,
    "verified": true
  }
}
```

---

### Attendance Endpoints (Mobile ↔ Backend)

#### POST /api/attendance/record
**Record attendance (Petugas)**
```json
Request:
{
  "organization_id": 1,
  "member_id": 1,
  "recorded_by": 2, -- Petugas ID
  "attendance_date": "2024-12-03",
  "check_in_time": "08:00:00",
  "face_image": "base64_encoded_image",
  "face_match_score": 0.95,
  "remarks": "On time"
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "status": "present",
    "created_at": "2024-12-03T08:00:00Z"
  }
}
```

#### POST /api/attendance/submit
**Submit attendance (User/Member)**
```json
Request:
{
  "organization_id": 1,
  "attendance_date": "2024-12-03",
  "check_in_time": "08:00:00",
  "face_image": "base64_encoded_image",
  "remarks": "Arrived on time"
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "status": "present",
    "created_at": "2024-12-03T08:00:00Z"
  }
}
```

#### POST /api/attendance/sync
**Sync attendance records (Mobile → Backend)**
```json
Request:
{
  "device_id": "mobile_device_id",
  "records": [
    {
      "id": "local_id_1",
      "member_id": 1,
      "attendance_date": "2024-12-03",
      "check_in_time": "08:00:00",
      "face_image": "base64_encoded_image"
    }
  ]
}

Response:
{
  "success": true,
  "data": {
    "synced": 5,
    "failed": 0,
    "last_sync_at": "2024-12-03T10:00:00Z"
  }
}
```

---

### Website Endpoints (Admin/Manager)

#### GET /api/organizations/:id/attendance
**List attendance records**
```
Query:
?start_date=2024-12-01&end_date=2024-12-31&member_id=1&status=present

Response:
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 1,
        "member_name": "John Doe",
        "attendance_date": "2024-12-03",
        "check_in_time": "08:00:00",
        "status": "present",
        "recorded_by": "Petugas Name",
        "face_match_score": 0.95
      }
    ],
    "total": 100
  }
}
```

#### GET /api/organizations/:id/members
**List members**
```
Response:
{
  "success": true,
  "data": {
    "members": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "department": "IT",
        "position": "Manager",
        "face_registered": true,
        "last_attendance": "2024-12-03T08:00:00Z"
      }
    ]
  }
}
```

#### POST /api/organizations/:id/members/import
**Import members (Excel)**
```
Same as before - import members data
```

---

## Key Differences from Original Design

| Aspek | Original | Revised |
|-------|----------|---------|
| **Member Login** | Website | Mobile App |
| **Face Registration** | Website | Mobile App (User/Member) |
| **Attendance Capture** | Website | Mobile App (Petugas) |
| **Website Function** | Multi-purpose | Management Only |
| **Roles** | Admin, Support, Manager, Member | Petugas, User/Member (Mobile) + Admin, Support, Manager (Website) |
| **Data Flow** | Unidirectional | Mobile → Backend → Website |
| **Face Recognition** | Not mentioned | Core feature |

---

## Implementation Implications

### What Changes
- ✅ Remove member login from website
- ✅ Add face data tables to database
- ✅ Add face API endpoints
- ✅ Add attendance sync endpoints
- ✅ Update website to display mobile-recorded data
- ✅ Add face image storage/retrieval

### What Stays Same
- ✅ Organization management
- ✅ Member management (import, edit)
- ✅ Role-based access control
- ✅ Setup wizard
- ✅ Report generation
- ✅ Multi-organization support

### New Components Needed
- ✅ Face data management
- ✅ Attendance sync system
- ✅ Face image storage (S3/local)
- ✅ Real-time sync handling
- ✅ Offline support (mobile)

---

## Summary

**Website** = Management Dashboard
- Admin/Manager login
- View attendance data
- Manage members
- Generate reports
- Manage organization

**Mobile App** = Operational Tool
- User/Member: Register face, submit attendance
- Petugas: Record attendance with face capture
- Real-time sync to backend
- Offline support

**Backend** = Data Hub
- Store face data
- Store attendance records
- Sync data between mobile and website
- Provide APIs for both

---

**Dokumentasi ini sudah di-revisi sesuai klarifikasi. Silakan review dan beri tahu jika ada yang masih perlu diluruskan.**
