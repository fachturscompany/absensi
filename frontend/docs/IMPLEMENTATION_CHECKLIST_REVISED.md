# Implementation Checklist - REVISED

## 📋 Daftar Isi
1. [Pre-Implementation](#pre-implementation)
2. [Phase 1: Store & State Management](#phase-1-store--state-management)
3. [Phase 2: Authentication Flow](#phase-2-authentication-flow)
4. [Phase 3: Organization Management](#phase-3-organization-management)
5. [Phase 4: Role Management](#phase-4-role-management)
6. [Phase 5: Setup Wizard](#phase-5-setup-wizard)
7. [Phase 6: Member Management](#phase-6-member-management)
8. [Phase 7: Attendance Display](#phase-7-attendance-display)
9. [Phase 8: Reports & Analytics](#phase-8-reports--analytics)
10. [Phase 9: Integration & Testing](#phase-9-integration--testing)

---

## Pre-Implementation

### Database Setup
- [ ] Create `member_face_data` table (for face metadata)
- [ ] Create `attendance_sync_logs` table (for sync tracking)
- [ ] Add `face_image_url` column to `attendance_records`
- [ ] Add `face_match_score` column to `attendance_records`
- [ ] Add `recorded_by` column to `attendance_records`
- [ ] Add `source` column to `attendance_records` (mobile, website, manual)
- [ ] Add necessary indexes
- [ ] Verify data integrity

**Note:** No member login table needed - members login via mobile app

### Dependencies
- [ ] Install `xlsx` library for Excel import
- [ ] Install `react-hook-form` (already installed)
- [ ] Install `zod` for validation (already installed)
- [ ] Install `zustand` for state management (already installed)
- [ ] Verify image storage solution (S3, local, or other)

### Documentation Review
- [ ] Review MULTI_ORG_ARCHITECTURE_REVISED.md
- [ ] Review WEBSITE_SCOPE_CLARIFICATION.md
- [ ] Review MULTI_ORG_API_CONTRACTS.md
- [ ] Review MULTI_ORG_DATABASE_SETUP.md
- [ ] Clarify any ambiguities with stakeholders

---

## Phase 1: Store & State Management

### Update org-store.ts
- [ ] Add `organizations` state (list of user's orgs)
- [ ] Add `currentRole` state (current role code)
- [ ] Add `currentRoleId` state (current role ID)
- [ ] Add `setOrganizations()` method
- [ ] Add `setCurrentRole()` method
- [ ] Add `getOrganizationById()` helper
- [ ] Add `getCurrentRolePermissions()` helper
- [ ] Add persistence to localStorage
- [ ] Add reset method

**File:** `src/store/org-store.ts`

### Update user-store.ts
- [ ] Add `roleId` state (current role ID)
- [ ] Add `userOrganizations` state
- [ ] Add `setRoleId()` method
- [ ] Add `setUserOrganizations()` method
- [ ] Add `getOrganizationRoles()` helper
- [ ] Update reset method to clear org-specific data
- [ ] **Remove** member-specific data (face data, etc)

**File:** `src/store/user-store.ts`

### Create Types
- [ ] Create `Organization` interface
- [ ] Create `UserOrganization` interface
- [ ] Create `Role` interface
- [ ] Create `Permission` interface
- [ ] Create `OrganizationSettings` interface
- [ ] Create `AttendanceRecord` interface (with face data)
- [ ] Create `MemberFaceData` interface

**File:** `src/lib/types/organization.ts`

---

## Phase 2: Authentication Flow

### Update Login Flow
- [ ] Modify `/api/auth/login` to return organizations
- [ ] Fetch user's organizations after login
- [ ] Store organizations in org-store
- [ ] **Remove** member login logic (members login via mobile)
- [ ] Redirect to organization-selector if multiple orgs
- [ ] Redirect to role-selector if single org
- [ ] Redirect to setup-wizard if new user (no orgs)

**Files:**
- `src/app/auth/login/page.tsx`
- `src/action/auth.ts` (or similar)

### Update Logout Flow
- [ ] Clear org-store on logout
- [ ] Clear user-store on logout
- [ ] Clear localStorage
- [ ] Redirect to login page

**Files:**
- `src/app/auth/logout/page.tsx` (or similar)

### Create Auth Middleware
- [ ] Check if user authenticated
- [ ] Check if organization selected
- [ ] Check if role selected
- [ ] Redirect to appropriate page based on state
- [ ] **Remove** member-specific middleware

**File:** `src/middleware.ts`

---

## Phase 3: Organization Management

### Create Organization Selector Page
- [ ] Display list of user's organizations
- [ ] Show organization details (name, code, member count)
- [ ] Add "Create New Organization" button
- [ ] Add "Accept Invitation" button (if applicable)
- [ ] Handle organization selection
- [ ] Redirect to role-selector on selection
- [ ] Redirect to setup-wizard on create new

**File:** `src/app/organization-selector/page.tsx`

### Create Organization Selector Component
- [ ] Display organization cards
- [ ] Show role badges for each org
- [ ] Add loading state
- [ ] Add error handling
- [ ] Add empty state

**File:** `src/components/organization/organization-selector.tsx`

### Create Organization Creation Flow
- [ ] Form for basic org info (name, code, country, timezone)
- [ ] Validation
- [ ] API call to create org
- [ ] Store created org in org-store
- [ ] Redirect to setup-wizard

**File:** `src/components/organization/create-organization-form.tsx`

### Create API Endpoints
- [ ] `GET /api/organizations` - List user's orgs
- [ ] `POST /api/organizations` - Create new org
- [ ] `GET /api/organizations/:id` - Get org details
- [ ] `PUT /api/organizations/:id` - Update org (admin only)

**File:** `src/app/api/organizations/route.ts`

---

## Phase 4: Role Management

### Create Role Selector Page
- [ ] Display list of available roles in selected org
- [ ] Show role description and permissions
- [ ] Handle role selection
- [ ] Store selected role in org-store and user-store
- [ ] Fetch permissions for selected role
- [ ] Redirect to dashboard on selection

**File:** `src/app/role-selector/page.tsx`

### Create Role Selector Component
- [ ] Display role cards
- [ ] Show permissions for each role
- [ ] Add loading state
- [ ] Add error handling
- [ ] Add empty state

**File:** `src/components/role/role-selector.tsx`

### Create API Endpoints
- [ ] `GET /api/organizations/:id/roles` - List available roles
- [ ] `GET /api/roles/:roleId/permissions` - Get role permissions
- [ ] `POST /api/organizations/:id/members/:memberId/roles` - Assign role

**File:** `src/app/api/roles/route.ts`

### Update Permission System
- [ ] Fetch permissions for selected role
- [ ] Store permissions in user-store
- [ ] Use permissions for access control
- [ ] Update existing permission checks

**Files:**
- `src/lib/permissions.ts`
- `src/hooks/usePermissions.ts`

---

## Phase 5: Setup Wizard

### Create Setup Wizard Page
- [ ] Multi-step form (4 steps)
- [ ] Progress indicator
- [ ] Step navigation (next, prev, skip)
- [ ] Form validation
- [ ] Error handling
- [ ] Success redirect

**File:** `src/app/setup-wizard/page.tsx`

### Step 1: Organization Info
- [ ] Organization Name input
- [ ] Organization Code input
- [ ] Country selector
- [ ] Timezone selector
- [ ] Address textarea
- [ ] Validation

**File:** `src/components/setup-wizard/steps/org-info.tsx`

### Step 2: Basic Settings
- [ ] Currency selector
- [ ] Work Hours Start time picker
- [ ] Work Hours End time picker
- [ ] Attendance Method selector
- [ ] Leave Policy selector
- [ ] Validation

**File:** `src/components/setup-wizard/steps/basic-settings.tsx`

### Step 3: Import Members
- [ ] File upload (Excel only)
- [ ] Column mapping UI
- [ ] Preview data
- [ ] Validation
- [ ] Error display
- [ ] Success summary

**File:** `src/components/setup-wizard/steps/import-members.tsx`

### Step 4: Role Assignment
- [ ] Select default role
- [ ] Optional: assign specific roles to members
- [ ] Preview assignments
- [ ] Confirmation

**File:** `src/components/setup-wizard/steps/role-assignment.tsx`

### Setup Wizard State Management
- [ ] Create setup-wizard store or use form state
- [ ] Handle step progression
- [ ] Persist form data
- [ ] Handle cancellation

**File:** `src/store/setup-wizard-store.ts`

---

## Phase 6: Member Management

### Create Member Management Page
- [ ] Display member list
- [ ] Filter by department, position, status
- [ ] Search members
- [ ] View member details
- [ ] Edit member data
- [ ] Delete member
- [ ] Bulk actions (import, assign role, etc)

**File:** `src/app/members/page.tsx`

### Create Member List Component
- [ ] Table or card view
- [ ] Pagination
- [ ] Sorting
- [ ] Filtering
- [ ] Search
- [ ] Bulk selection

**File:** `src/components/member/member-list.tsx`

### Create Member Import Component
- [ ] File upload input
- [ ] File validation
- [ ] Column detection/mapping
- [ ] Data preview
- [ ] Import progress
- [ ] Error reporting

**File:** `src/components/member-import/member-import.tsx`

### Create Excel Template
- [ ] Generate Excel template file
- [ ] Include headers: First Name, Last Name, Email, Phone, Department, Position
- [ ] Add sample data
- [ ] Add instructions sheet

**File:** `src/lib/excel/member-import-template.ts`

### Create Excel Parser
- [ ] Parse Excel file
- [ ] Extract data
- [ ] Validate data
- [ ] Map columns
- [ ] Handle errors

**File:** `src/lib/excel/excel-parser.ts`

### Create Member Import API
- [ ] `POST /api/organizations/:id/members/import` - Import members
- [ ] `POST /api/organizations/:id/members/import/validate` - Validate file
- [ ] `GET /api/organizations/:id/members/import/template` - Download template

**File:** `src/app/api/members/import/route.ts`

### Member Import Validation
- [ ] Validate file format (xlsx only)
- [ ] Validate required columns
- [ ] Validate email format
- [ ] Check for duplicates
- [ ] Validate department/position
- [ ] Provide detailed error messages

**File:** `src/lib/validation/member-import.ts`

### Member Import Processing
- [ ] Create members in database
- [ ] Create organization_members records
- [ ] Assign default role
- [ ] **Do NOT** send invitation emails (members register via mobile)
- [ ] Log import activity
- [ ] Handle rollback on error

**File:** `src/action/member-import.ts`

---

## Phase 7: Attendance Display

### Create Attendance Dashboard
- [ ] Display today's attendance summary
- [ ] Show attendance statistics
- [ ] Quick actions
- [ ] Recent attendance records

**File:** `src/app/(dashboard)/page.tsx` (update existing)

### Create Attendance List Page
- [ ] Display all attendance records
- [ ] Filter by date range
- [ ] Filter by member
- [ ] Filter by status (present, late, absent)
- [ ] Filter by department
- [ ] Search attendance
- [ ] View attendance details
- [ ] **Display face image** (if captured by petugas)
- [ ] **Display face match score** (if available)
- [ ] **Display who recorded** (petugas name)

**File:** `src/app/attendance/page.tsx` (update existing)

### Create Attendance Detail View
- [ ] Show full attendance record
- [ ] Display face image
- [ ] Display face match score
- [ ] Display recorded by (petugas)
- [ ] Display member info
- [ ] Display remarks
- [ ] Show approval status (if applicable)

**File:** `src/components/attendance/attendance-detail.tsx`

### Create Attendance Filter Component
- [ ] Date range picker
- [ ] Member selector
- [ ] Status filter
- [ ] Department filter
- [ ] Search input
- [ ] Apply/reset filters

**File:** `src/components/attendance/attendance-filter.tsx`

### Create API Endpoints
- [ ] `GET /api/organizations/:id/attendance` - List attendance
- [ ] `GET /api/organizations/:id/attendance/:id` - Get attendance detail
- [ ] `GET /api/organizations/:id/attendance/stats` - Get statistics

**File:** `src/app/api/attendance/route.ts`

### Update Attendance Display
- [ ] Filter by current organization
- [ ] Filter by current user's role
- [ ] Show only relevant data
- [ ] Update permissions checks
- [ ] **Remove** member-specific attendance features

**File:** `src/app/attendance/page.tsx`

---

## Phase 8: Reports & Analytics

### Create Reports Page
- [ ] Attendance summary report
- [ ] Attendance detail report
- [ ] Member attendance report
- [ ] Department attendance report
- [ ] Export to Excel
- [ ] Export to PDF
- [ ] Schedule report
- [ ] Email report

**File:** `src/app/reports/page.tsx`

### Create Report Generator Component
- [ ] Report type selector
- [ ] Date range picker
- [ ] Filter options
- [ ] Preview
- [ ] Export options

**File:** `src/components/reports/report-generator.tsx`

### Create Analytics Dashboard
- [ ] Attendance statistics
- [ ] Late/absent trends
- [ ] Department performance
- [ ] Member performance
- [ ] Charts & graphs
- [ ] Time series analysis

**File:** `src/components/analytics/analytics-dashboard.tsx`

### Create API Endpoints
- [ ] `GET /api/organizations/:id/reports/attendance-summary` - Summary report
- [ ] `GET /api/organizations/:id/reports/attendance-detail` - Detail report
- [ ] `GET /api/organizations/:id/analytics/stats` - Analytics data
- [ ] `POST /api/organizations/:id/reports/export` - Export report

**File:** `src/app/api/reports/route.ts`

---

## Phase 9: Integration & Testing

### Update Existing Pages for Multi-Org

#### Dashboard
- [ ] Add org selector in header
- [ ] Filter data by current org
- [ ] Show current role
- [ ] Update statistics for current org
- [ ] **Remove** member-specific features

**File:** `src/app/(dashboard)/page.tsx`

#### Attendance
- [ ] Filter by current org
- [ ] Filter by current user's role
- [ ] Show only relevant data
- [ ] Update permissions checks
- [ ] **Display face images** from mobile
- [ ] **Display face match scores**
- [ ] **Display petugas name**

**File:** `src/app/attendance/page.tsx`

#### Members
- [ ] Filter by current org
- [ ] Show only org members
- [ ] Update permissions checks
- [ ] Add import button
- [ ] **Remove** member login features

**File:** `src/app/members/page.tsx`

#### Leaves
- [ ] Filter by current org
- [ ] Show only org leaves
- [ ] Update permissions checks

**File:** `src/app/leaves/page.tsx`

#### Settings
- [ ] Filter by current org
- [ ] Show only org settings
- [ ] Restrict to admin role
- [ ] Update org settings

**File:** `src/app/organization/settings/page.tsx`

### Create Header Component Update
- [ ] Add current organization display
- [ ] Add current role display
- [ ] Add organization switcher (logout + select new org)
- [ ] Add user menu
- [ ] **Remove** member profile features

**File:** `src/components/header/header.tsx`

### Create Org/Role Switcher
- [ ] Logout current org/role
- [ ] Redirect to organization-selector
- [ ] Clear current org/role from stores

**File:** `src/components/org-role-switcher.tsx`

### Unit Tests
- [ ] Test org-store
- [ ] Test user-store
- [ ] Test organization selector
- [ ] Test role selector
- [ ] Test setup wizard steps
- [ ] Test member import validation
- [ ] Test permission checks
- [ ] Test attendance display

**Files:**
- `src/store/__tests__/org-store.test.ts`
- `src/store/__tests__/user-store.test.ts`
- `src/components/__tests__/organization-selector.test.tsx`
- `src/lib/__tests__/member-import.test.ts`

### Integration Tests
- [ ] Test complete login flow
- [ ] Test organization selection flow
- [ ] Test role selection flow
- [ ] Test setup wizard flow
- [ ] Test member import flow
- [ ] Test org/role switching
- [ ] Test access control
- [ ] Test attendance display

**File:** `src/__tests__/integration/multi-org-flow.test.ts`

### E2E Tests (Optional)
- [ ] Test complete admin journey
- [ ] Test multi-org scenarios
- [ ] Test error handling
- [ ] Test edge cases

**File:** `e2e/multi-org.spec.ts`

### Performance Testing
- [ ] Test with large number of organizations
- [ ] Test with large number of members
- [ ] Test with large number of attendance records
- [ ] Test import performance
- [ ] Optimize queries if needed

### Security Testing
- [ ] Test authorization checks
- [ ] Test org isolation
- [ ] Test role-based access
- [ ] Test data leakage prevention
- [ ] Test face data security

### Bug Fixes & Polish
- [ ] Fix any bugs found during testing
- [ ] Improve error messages
- [ ] Improve loading states
- [ ] Improve UI/UX
- [ ] Add analytics tracking

---

## Implementation Timeline

### Estimated Duration: 3-4 weeks

| Phase | Duration | Status |
|-------|----------|--------|
| Pre-Implementation | 1-2 days | ⏳ Pending |
| Phase 1: Store & State | 1-2 days | ⏳ Pending |
| Phase 2: Auth Flow | 2-3 days | ⏳ Pending |
| Phase 3: Org Management | 2-3 days | ⏳ Pending |
| Phase 4: Role Management | 2-3 days | ⏳ Pending |
| Phase 5: Setup Wizard | 3-4 days | ⏳ Pending |
| Phase 6: Member Management | 2-3 days | ⏳ Pending |
| Phase 7: Attendance Display | 3-4 days | ⏳ Pending |
| Phase 8: Reports & Analytics | 2-3 days | ⏳ Pending |
| Phase 9: Integration & Testing | 4-5 days | ⏳ Pending |

---

## Risk Assessment

### High Risk
- [ ] Data migration (existing orgs/members)
- [ ] Permission system changes
- [ ] Multi-org data isolation
- [ ] Face data integration (from mobile)

### Medium Risk
- [ ] Excel import reliability
- [ ] Performance with large datasets
- [ ] User experience complexity
- [ ] Sync reliability with mobile

### Low Risk
- [ ] UI/UX changes
- [ ] Store management
- [ ] API endpoint creation
- [ ] Report generation

---

## Key Changes from Original

| Aspek | Original | Revised |
|-------|----------|---------|
| Member Login | Website | ❌ Removed (Mobile only) |
| Face Registration | Website | ❌ Removed (Mobile only) |
| Attendance Capture | Website | ❌ Removed (Mobile only) |
| Face Recognition | Not mentioned | ✅ Added (Mobile only) |
| Website Function | Multi-purpose | ✅ Management only |
| Data Source | Website | ✅ Mobile (via API) |
| Real-time Capture | Website | ❌ Removed |
| Offline Support | Website | ❌ Removed |

---

## Sign-Off

- [ ] Architecture approved by stakeholders
- [ ] Database schema approved
- [ ] API contracts approved
- [ ] Implementation plan approved
- [ ] Testing strategy approved
- [ ] Website scope clarified

---

**Checklist ini sudah di-revisi sesuai klarifikasi. Silakan review dan beri tahu jika ada yang masih perlu diluruskan.**
