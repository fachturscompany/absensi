# Website Scope Clarification

## 📋 Daftar Isi
1. [Website Purpose](#website-purpose)
2. [What Website Does](#what-website-does)
3. [What Website Does NOT Do](#what-website-does-not-do)
4. [Website User Types](#website-user-types)
5. [Website Features](#website-features)
6. [Data Source](#data-source)
7. [Integration Points](#integration-points)

---

## Website Purpose

### Primary Function
**MANAGEMENT DASHBOARD ONLY**

Website ini adalah **dashboard manajemen** untuk menampilkan dan mengelola data attendance yang sudah tercatat dari mobile app.

```
Website ≠ Attendance Recording System
Website = Attendance Management & Display System
```

---

## What Website Does

### ✅ Website CAN DO

#### 1. Display Attendance Data
- Tampilkan attendance records dari mobile app
- Filter by date, member, status, department
- Search attendance records
- View attendance history

#### 2. Manage Members
- Import members dari Excel
- Edit member data (name, email, phone, department, position)
- Delete members
- View member profiles
- View member face registration status

#### 3. Manage Organization
- Create organization (saat setup)
- Edit organization settings (work hours, timezone, currency)
- Manage departments
- Manage positions
- Manage roles & permissions

#### 4. Generate Reports
- Attendance summary report
- Attendance detail report
- Member attendance report
- Department attendance report
- Export to Excel/PDF

#### 5. Manage Roles & Permissions
- Create/edit roles
- Assign permissions to roles
- Assign roles to members
- View permission matrix

#### 6. View Analytics
- Attendance statistics
- Late/absent trends
- Department performance
- Member performance

#### 7. Manage Organization Settings
- Work hours configuration
- Timezone settings
- Currency settings
- Attendance method settings
- Leave policy settings

---

## What Website Does NOT Do

### ❌ Website CANNOT DO

#### 1. Member Authentication
```
❌ Member login ke website
❌ Member registration di website
❌ Member password management
```
**Reason:** Members login di mobile app, bukan website

#### 2. Face Registration
```
❌ Member registrasi wajah di website
❌ Capture wajah di website
❌ Face verification di website
```
**Reason:** Face registration hanya di mobile app oleh member

#### 3. Attendance Recording
```
❌ Petugas record attendance di website
❌ Capture wajah saat absensi di website
❌ Real-time attendance capture di website
```
**Reason:** Attendance recording hanya di mobile app oleh petugas

#### 4. Face Capture/Recognition
```
❌ Tidak ada camera/face recognition di website
❌ Tidak ada face matching di website
❌ Tidak ada face verification di website
```
**Reason:** Semua face processing di mobile app

#### 5. Real-Time Sync
```
❌ Website tidak sync real-time dengan mobile
❌ Website tidak capture data real-time
❌ Website tidak push data ke mobile
```
**Reason:** Mobile push data ke backend, website pull dari backend

#### 6. Offline Support
```
❌ Website tidak support offline mode
❌ Website tidak cache data lokal
❌ Website tidak queue requests
```
**Reason:** Website selalu online, mobile yang support offline

---

## Website User Types

### 1. Admin Organization
**Location:** Website Only
**Can:**
- ✅ Login ke website
- ✅ View semua attendance
- ✅ Manage members
- ✅ Manage organization
- ✅ Manage roles
- ✅ Generate reports
- ✅ View analytics

**Cannot:**
- ❌ Capture attendance
- ❌ Register face
- ❌ Access mobile app

---

### 2. Support/Manager
**Location:** Website Only
**Can:**
- ✅ Login ke website
- ✅ View attendance
- ✅ Generate reports
- ✅ View analytics
- ✅ View member profiles

**Cannot:**
- ❌ Manage members
- ❌ Manage organization
- ❌ Manage roles
- ❌ Capture attendance
- ❌ Register face

---

### 3. Petugas (Officer)
**Location:** Mobile App Only
**Can:**
- ✅ Login ke mobile app
- ✅ Capture attendance
- ✅ Record wajah member
- ✅ Verify face
- ✅ Submit attendance

**Cannot:**
- ❌ Access website
- ❌ Manage members
- ❌ View reports
- ❌ Manage organization

---

### 4. User/Member
**Location:** Mobile App Only
**Can:**
- ✅ Login ke mobile app
- ✅ Register face
- ✅ Submit attendance
- ✅ View own attendance history

**Cannot:**
- ❌ Access website
- ❌ Manage anything
- ❌ View other members' data
- ❌ Capture other members' attendance

---

## Website Features

### Feature List

#### Dashboard
```
✅ Overview statistics
✅ Today's attendance summary
✅ Recent attendance records
✅ Quick actions
```

#### Attendance Management
```
✅ View attendance records
✅ Filter by date range
✅ Filter by member
✅ Filter by status
✅ Filter by department
✅ Search attendance
✅ View attendance details
✅ View face image (if captured)
✅ View face match score
✅ View who recorded (petugas name)
```

#### Member Management
```
✅ View member list
✅ Import members (Excel)
✅ Edit member data
✅ Delete member
✅ View member profile
✅ View face registration status
✅ View member attendance history
✅ Assign role to member
```

#### Organization Management
```
✅ View organization info
✅ Edit organization settings
✅ Manage departments
✅ Manage positions
✅ Manage work schedules
✅ Manage leave types
✅ Configure work hours
✅ Configure timezone
✅ Configure currency
```

#### Role Management
```
✅ Create role
✅ Edit role
✅ Delete role
✅ Assign permissions
✅ View permission matrix
✅ Assign role to member
```

#### Reports
```
✅ Attendance summary report
✅ Attendance detail report
✅ Member attendance report
✅ Department attendance report
✅ Export to Excel
✅ Export to PDF
✅ Schedule report
✅ Email report
```

#### Analytics
```
✅ Attendance statistics
✅ Late/absent trends
✅ Department performance
✅ Member performance
✅ Charts & graphs
✅ Time series analysis
```

#### Settings
```
✅ Organization settings
✅ User account settings
✅ Notification settings
✅ Report settings
✅ Integration settings
```

---

## Data Source

### Where Data Comes From

#### Attendance Data
```
Source: Mobile App (Petugas records)
Flow: Mobile → Backend Server → Website
Display: Website shows data from backend
Update: Website refreshes when new data synced
```

#### Member Data
```
Source: Website (Admin imports/creates)
Flow: Website → Backend Server → Mobile App
Display: Website shows members, mobile shows members to record
```

#### Face Data
```
Source: Mobile App (Member registers, Petugas captures)
Flow: Mobile → Backend Server → Website (display only)
Display: Website shows face images & match scores
```

#### Organization Data
```
Source: Website (Admin creates/edits)
Flow: Website → Backend Server → Mobile App
Display: Website shows org settings, mobile uses settings
```

---

## Integration Points

### Website ↔ Backend Server

#### Data Website Sends to Backend
```
✅ Member data (import, edit, delete)
✅ Organization settings
✅ Role & permission assignments
✅ Report requests
✅ User preferences
```

#### Data Website Receives from Backend
```
✅ Attendance records (from mobile)
✅ Member data
✅ Organization data
✅ Face images & metadata
✅ Analytics data
✅ Report data
```

---

### Backend Server ↔ Mobile App

#### Data Mobile Sends to Backend
```
✅ Attendance records (recorded by petugas)
✅ Attendance submissions (by member)
✅ Face data (registration & capture)
✅ Device info
✅ Sync status
```

#### Data Mobile Receives from Backend
```
✅ Member list
✅ Organization settings
✅ Face data (for verification)
✅ Sync confirmation
✅ Updates & patches
```

---

## Data Flow Diagram

### Complete Data Flow
```
┌─────────────────────────────────────────────────────────────┐
│                    WEBSITE                                  │
│  Admin/Manager login & manage data                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Import Members                                      │   │
│  │ Manage Organization                                 │   │
│  │ Manage Roles                                        │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │                                        │
│                     │ Send: Member, Org, Role data          │
│                     │                                        │
└─────────────────────┼────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND SERVER                             │
│  Store & manage all data                                    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Member Data                                         │   │
│  │ Organization Data                                   │   │
│  │ Attendance Records                                  │   │
│  │ Face Data                                           │   │
│  │ Role & Permissions                                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────┬──────────────────────────────────────┘
      ▲               │
      │               │
      │ Receive:      │ Send:
      │ - Attendance  │ - Member list
      │ - Face data   │ - Org settings
      │ - Sync data   │ - Face data
      │               │
      │               ▼
      │    ┌─────────────────────────────────────────────────┐
      │    │              MOBILE APP                         │
      │    │  Petugas: Record attendance & capture face     │
      │    │  User/Member: Register face & submit attendance│
      │    │                                                 │
      │    │  ┌──────────────────────────────────────────┐  │
      │    │  │ Face Registration (Member)               │  │
      │    │  │ Face Capture (Petugas)                   │  │
      │    │  │ Attendance Recording (Petugas)           │  │
      │    │  │ Attendance Submission (Member)           │  │
      │    │  └──────────────────────────────────────────┘  │
      │    └─────────────────────────────────────────────────┘
      │
      └──────────────────────────────────────────────────────
         Sync: Send attendance & face data
```

### Website Display Flow
```
Mobile App Records Attendance
    ↓
Backend Server Stores Data
    ↓
Website API Fetches Data
    ↓
Website Dashboard Displays Data
    ↓
Admin/Manager Views & Manages
```

---

## Summary Table

| Aspek | Website | Mobile App |
|-------|---------|-----------|
| **User Login** | Admin, Manager, Support | Petugas, User/Member |
| **Face Registration** | ❌ | ✅ (Member) |
| **Face Capture** | ❌ | ✅ (Petugas) |
| **Attendance Record** | ❌ | ✅ (Petugas) |
| **Attendance Submit** | ❌ | ✅ (Member) |
| **View Attendance** | ✅ | ✅ (Own only) |
| **Manage Members** | ✅ | ❌ |
| **Manage Organization** | ✅ | ❌ |
| **Generate Reports** | ✅ | ❌ |
| **Real-time Capture** | ❌ | ✅ |
| **Offline Support** | ❌ | ✅ |
| **Face Recognition** | ❌ | ✅ |

---

## Implementation Focus for Website

### What to Build
1. ✅ Admin/Manager login
2. ✅ Organization selector
3. ✅ Role selector
4. ✅ Dashboard with attendance data
5. ✅ Attendance list & filter
6. ✅ Member management
7. ✅ Organization settings
8. ✅ Role management
9. ✅ Reports & analytics
10. ✅ Member import (Excel)

### What NOT to Build
1. ❌ Member login
2. ❌ Face registration UI
3. ❌ Face capture/recognition
4. ❌ Real-time attendance capture
5. ❌ Offline support
6. ❌ Mobile-specific features
7. ❌ Camera integration
8. ❌ Face matching algorithms

---

## Key Takeaways

### Website is ONLY for:
- 📊 **Display** attendance data
- 📋 **Manage** members & organization
- 📈 **Generate** reports & analytics
- 🔐 **Control** roles & permissions

### Website is NOT for:
- 👤 Member operations
- 📸 Face operations
- ⏱️ Attendance recording
- 🔄 Real-time sync
- 📱 Mobile operations

### Mobile App is for:
- 👤 Member registration & login
- 📸 Face registration & capture
- ⏱️ Attendance recording (Petugas)
- ⏱️ Attendance submission (Member)
- 🔄 Real-time sync

---

**Dokumentasi ini menjelaskan scope website dengan jelas. Silakan review dan pastikan semua sudah sesuai dengan requirement.**
