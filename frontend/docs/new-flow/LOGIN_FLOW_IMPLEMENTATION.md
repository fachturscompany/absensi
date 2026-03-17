# Login Flow Implementation Guide

## 📋 Overview

Flow login website setelah user berhasil login:

```
Login Page
    ↓
Authenticate (Supabase)
    ↓
Fetch User Organizations
    ↓
Organization Selector Page
    ↓
Select Organization
    ↓
Role Selector Page (jika multiple roles)
    ↓
Dashboard
```

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ 1. LOGIN PAGE (/auth/login)                             │
│    - Email & Password input                             │
│    - Sign in button                                     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 2. AUTHENTICATION                                       │
│    - Supabase Auth.signInWithPassword()                │
│    - Get user ID & token                               │
│    - Store in auth store                               │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 3. FETCH ORGANIZATIONS                                  │
│    - Call getUserOrganizations()                        │
│    - Get list of orgs user is member of                │
│    - Store in org store                                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 4. ORGANIZATION SELECTOR (/organization-selector)      │
│    - Display list of organizations                     │
│    - User select one organization                      │
│    - Store selected org in org store                   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 5. CHECK ROLES FOR SELECTED ORG                        │
│    - Get roles for selected organization               │
│    - If 1 role → go to dashboard                       │
│    - If multiple roles → go to role selector           │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼ (1 role)            ▼ (multiple roles)
   DASHBOARD          ROLE SELECTOR PAGE
                      (/role-selector)
                      - Display roles
                      - User select role
                      - Store in org store
                           │
                           ▼
                      DASHBOARD
```

---

## 📝 Implementation Steps

### Step 1: Update Login Page
**File:** `src/app/auth/login/page.tsx`

After successful login:
```typescript
// After Supabase auth success
const { data: { user } } = await supabase.auth.getUser()

// Fetch organizations
const orgsResponse = await getUserOrganizations()

// Store in auth store
useAuthStore.setState({
  user: { id: user.id, email: user.email, ... },
  userOrganizations: orgsResponse.organizations
})

// Redirect to organization selector
router.push('/organization-selector')
```

---

### Step 2: Organization Selector Page
**File:** `src/app/organization-selector/page.tsx`

- ✅ Already created
- Display list of organizations
- On select → check roles
- If 1 role → redirect to dashboard
- If multiple roles → redirect to role selector

---

### Step 3: Role Selector Page
**File:** `src/app/role-selector/page.tsx`

- Display available roles for selected organization
- User select role
- Store role in org store
- Redirect to dashboard

---

### Step 4: Middleware Protection
**File:** `src/middleware.ts`

Protect routes:
- `/organization-selector` → require auth
- `/role-selector` → require auth + organization selected
- `/dashboard/*` → require auth + organization + role selected
- `/auth/login` → redirect to org selector if already authenticated

---

## 🔐 Store Structure

### Auth Store (user-store.ts)
```typescript
{
  user: IUser | null
  role: string | null
  roleId: number | null
  permissions: string[]
  userOrganizations: UserOrganization[]
}
```

### Org Store (org-store.ts)
```typescript
{
  organizationId: number | null
  organizationName: string | null
  timezone: string
  currentRole: string | null
  currentRoleId: number | null
  organizations: Organization[]
}
```

---

## 🎯 Key Points

1. **Organization Selection is MANDATORY**
   - User harus select organization sebelum akses dashboard
   - Tidak bisa skip organization selector

2. **Role Selection is CONDITIONAL**
   - Jika user hanya punya 1 role → auto select
   - Jika user punya multiple roles → harus select

3. **Permissions Based on Role**
   - Setelah role selected → fetch permissions
   - Store permissions di auth store
   - Use untuk conditional rendering di dashboard

4. **Persistent Storage**
   - Org & role disimpan di localStorage
   - Jika refresh → tetap di organization yang sama
   - Jika logout → clear semua

---

## 🔄 API Endpoints Needed

1. **getUserOrganizations()**
   - Return: List of organizations user is member of
   - Include: roles for each organization

2. **getOrganizationRoles(organizationId)**
   - Return: List of roles user has in this organization

3. **getRolePermissions(roleId)**
   - Return: List of permissions for this role

---

## ✅ Checklist

- [ ] Update login page to redirect to org selector
- [ ] Verify organization selector page works
- [ ] Create role selector page
- [ ] Update middleware for route protection
- [ ] Test complete flow: Login → Org Select → Role Select → Dashboard
- [ ] Test refresh maintains org & role selection
- [ ] Test logout clears everything
- [ ] Test multiple organizations
- [ ] Test multiple roles

---

**Status:** Ready for implementation
