# Multi-Organization Implementation Checklist

## 📋 Daftar Isi
1. [Pre-Implementation](#pre-implementation)
2. [Phase 1: Store & State Management](#phase-1-store--state-management)
3. [Phase 2: Authentication Flow](#phase-2-authentication-flow)
4. [Phase 3: Organization Management](#phase-3-organization-management)
5. [Phase 4: Role Management](#phase-4-role-management)
6. [Phase 5: Setup Wizard](#phase-5-setup-wizard)
7. [Phase 6: Member Import](#phase-6-member-import)
8. [Phase 7: Integration & Testing](#phase-7-integration--testing)

---

## Pre-Implementation

### Database Setup
- [ ] Create `organization_member_roles` table
- [ ] Create `organization_settings` table
- [ ] Create `member_import_logs` table
- [ ] Add necessary indexes
- [ ] Migrate existing data
- [ ] Verify data integrity

### Dependencies
- [ ] Install `xlsx` library for Excel import
- [ ] Install `react-hook-form` (already installed)
- [ ] Install `zod` for validation (already installed)
- [ ] Install `zustand` for state management (already installed)

### Documentation Review
- [ ] Review MULTI_ORG_MULTI_ROLE_ARCHITECTURE.md
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

**File:** `src/store/user-store.ts`

### Create Types
- [ ] Create `Organization` interface
- [ ] Create `UserOrganization` interface
- [ ] Create `Role` interface
- [ ] Create `Permission` interface
- [ ] Create `OrganizationSettings` interface

**File:** `src/lib/types/organization.ts`

---

## Phase 2: Authentication Flow

### Update Login Flow
- [ ] Modify `/api/auth/login` to return organizations
- [ ] Fetch user's organizations after login
- [ ] Store organizations in org-store
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

## Phase 6: Member Import

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
- [ ] Send invitation emails (optional)
- [ ] Log import activity
- [ ] Handle rollback on error

**File:** `src/action/member-import.ts`

---

## Phase 7: Integration & Testing

### Update Existing Pages for Multi-Org

#### Dashboard
- [ ] Add org selector in header
- [ ] Filter data by current org
- [ ] Show current role
- [ ] Update statistics for current org

**File:** `src/app/(dashboard)/page.tsx`

#### Attendance
- [ ] Filter by current org
- [ ] Filter by current user's role
- [ ] Show only relevant data
- [ ] Update permissions checks

**File:** `src/app/attendance/page.tsx`

#### Members
- [ ] Filter by current org
- [ ] Show only org members
- [ ] Update permissions checks
- [ ] Add import button

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

**File:** `src/__tests__/integration/multi-org-flow.test.ts`

### E2E Tests (Optional)
- [ ] Test complete user journey
- [ ] Test multi-org scenarios
- [ ] Test error handling
- [ ] Test edge cases

**File:** `e2e/multi-org.spec.ts`

### Performance Testing
- [ ] Test with large number of organizations
- [ ] Test with large number of members
- [ ] Test import performance
- [ ] Optimize queries if needed

### Security Testing
- [ ] Test authorization checks
- [ ] Test org isolation
- [ ] Test role-based access
- [ ] Test data leakage prevention

### Bug Fixes & Polish
- [ ] Fix any bugs found during testing
- [ ] Improve error messages
- [ ] Improve loading states
- [ ] Improve UI/UX
- [ ] Add analytics tracking

---

## Implementation Timeline

### Estimated Duration: 2-3 weeks

| Phase | Duration | Status |
|-------|----------|--------|
| Pre-Implementation | 1-2 days | ⏳ Pending |
| Phase 1: Store & State | 1-2 days | ⏳ Pending |
| Phase 2: Auth Flow | 2-3 days | ⏳ Pending |
| Phase 3: Org Management | 2-3 days | ⏳ Pending |
| Phase 4: Role Management | 2-3 days | ⏳ Pending |
| Phase 5: Setup Wizard | 3-4 days | ⏳ Pending |
| Phase 6: Member Import | 2-3 days | ⏳ Pending |
| Phase 7: Integration & Testing | 3-5 days | ⏳ Pending |

---

## Risk Assessment

### High Risk
- [ ] Data migration (existing orgs/members)
- [ ] Permission system changes
- [ ] Multi-org data isolation

### Medium Risk
- [ ] Excel import reliability
- [ ] Performance with large datasets
- [ ] User experience complexity

### Low Risk
- [ ] UI/UX changes
- [ ] Store management
- [ ] API endpoint creation

---

## Sign-Off

- [ ] Architecture approved by stakeholders
- [ ] Database schema approved
- [ ] API contracts approved
- [ ] Implementation plan approved
- [ ] Testing strategy approved

---

**Checklist ini akan di-update seiring dengan progress implementasi.**
