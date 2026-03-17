# Multi-Organization Quick Reference

## 🚀 Quick Start

### User Journey
```
1. Login (email + password)
   ↓
2. Select Organization (or create new)
   ↓
3. Select Role (in that organization)
   ↓
4. Dashboard (role-based access)
```

### Key Concepts

| Konsep | Penjelasan |
|--------|-----------|
| **Organization** | Perusahaan/entitas yang dikelola |
| **User** | Akun global (bisa di multiple orgs) |
| **Organization Member** | User di dalam organization |
| **Role** | Peran user dalam organization (Admin, Support, dll) |
| **Permission** | Akses spesifik (attendance:record:create, dll) |

---

## 📊 Database Quick Reference

### Key Tables
```
users → organization_members → organization_member_roles → system_roles
                    ↓
                organizations
                    ↓
            organization_settings
```

### Important Relationships
```
1 User → Many Organizations (via organization_members)
1 Organization → Many Members (via organization_members)
1 Member → Many Roles (via organization_member_roles)
1 Role → Many Permissions (via role_permissions)
```

---

## 🔐 Access Control

### Role Hierarchy
```
Super Admin (SA001)
├── Can access all organizations
├── Can manage all users
└── Can manage all roles

Admin Organization (A001)
├── Can access own organization
├── Can manage members
└── Can manage roles

Support / Manager / Staff
├── Can access own organization
├── Limited management capabilities
└── Cannot manage settings

Member (M001)
├── Can access own organization
├── Can view own data only
└── Cannot manage anything
```

### Permission Format
```
module:resource:action

Examples:
- attendance:record:create
- attendance:record:approve
- leaves:request:create
- members:manage:update
- settings:manage:update
```

---

## 💾 State Management

### org-store.ts
```typescript
{
  organizationId: number | null,
  organizationName: string | null,
  timezone: string,
  currentRole: string | null,
  currentRoleId: number | null,
  organizations: Organization[],
  
  setOrganizationId(id, name),
  setCurrentRole(roleCode, roleId),
  setOrganizations(orgs),
  reset()
}
```

### user-store.ts
```typescript
{
  user: IUser | null,
  role: string | null,
  roleId: number | null,
  permissions: string[],
  userOrganizations: UserOrganization[],
  
  setUser(updater),
  setRole(role, roleId),
  setPermissions(permissions),
  setUserOrganizations(orgs),
  reset()
}
```

---

## 🛣️ Route Protection

### Protected Routes
```
/organization-selector      ← After login, before org selection
/role-selector             ← After org selection, before role selection
/setup-wizard              ← Only for new org
/(dashboard)/*             ← Requires org + role selected
/attendance/*              ← Requires org + role selected
/members/*                 ← Requires org + role selected
/settings/*                ← Requires admin role + org selected
```

### Middleware Logic
```
1. Check authentication
   ├─ NO → /auth/login
   └─ YES → Continue

2. Check org selected
   ├─ NO → /organization-selector
   └─ YES → Continue

3. Check role selected
   ├─ NO → /role-selector
   └─ YES → Continue

4. Check permissions
   ├─ NO → /unauthorized
   └─ YES → Allow access
```

---

## 📝 Setup Wizard (5 Menit)

### Step 1: Organization Info (1 menit)
```
Input:
- Organization Name (required)
- Organization Code (required)
- Country (required)
- Timezone (required)
- Address (optional)
```

### Step 2: Basic Settings (1 menit)
```
Input:
- Currency (required)
- Work Hours Start (required)
- Work Hours End (required)
- Attendance Method (required)
- Leave Policy (required)
```

### Step 3: Import Members (2 menit)
```
Input:
- Excel file upload
- Column mapping

Excel Columns:
- First Name (required)
- Last Name (required)
- Email (required)
- Phone (optional)
- Department (optional)
- Position (optional)
```

### Step 4: Role Assignment (1 menit)
```
Input:
- Select default role for members
- Optional: assign specific roles
```

---

## 📤 Member Import

### Excel Template
```
| First Name | Last Name | Email              | Phone      | Department | Position |
|------------|-----------|-------------------|------------|------------|----------|
| John       | Doe       | john@example.com  | 081234567  | IT         | Manager  |
| Jane       | Smith     | jane@example.com  | 081234568  | HR         | Staff    |
```

### Import Flow
```
1. Upload Excel file
   ↓
2. Validate file format
   ↓
3. Detect/map columns
   ↓
4. Validate data
   ↓
5. Show preview
   ↓
6. User confirms
   ↓
7. Create members
   ↓
8. Assign default role
   ↓
9. Show summary
```

### Error Handling
```
- Invalid file format → Re-upload
- Missing columns → Re-upload
- Duplicate emails → Skip or merge
- Invalid email → Show warning
- Missing dept/pos → Create default
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Organizations
```
GET    /api/organizations
POST   /api/organizations
GET    /api/organizations/:id
PUT    /api/organizations/:id
```

### Roles
```
GET    /api/organizations/:id/roles
GET    /api/roles/:roleId/permissions
```

### Members
```
GET    /api/organizations/:id/members
POST   /api/organizations/:id/members
PUT    /api/organizations/:id/members/:memberId
DELETE /api/organizations/:id/members/:memberId
```

### Import
```
POST   /api/organizations/:id/members/import
POST   /api/organizations/:id/members/import/validate
GET    /api/organizations/:id/members/import/template
```

---

## 🧪 Testing Scenarios

### Happy Path
```
1. User login
2. Select organization
3. Select role
4. Access dashboard
5. View data (filtered by org)
6. Perform action (based on role)
```

### Multi-Org Scenario
```
1. User login
2. Select org A
3. Select role Admin
4. Access org A data
5. Logout org A
6. Select org B
7. Select role Member
8. Access org B data (limited)
```

### Setup Wizard Scenario
```
1. User login (first time)
2. Create new organization
3. Fill setup wizard (5 steps)
4. Import members from Excel
5. Assign roles
6. Access dashboard
```

### Permission Scenario
```
1. User login as Member
2. Try to access settings
3. Get 403 Forbidden
4. See only allowed features
```

---

## 🐛 Common Issues & Solutions

### Issue: User sees data from other organizations
**Solution:** Check organization_id filter in queries

### Issue: User can access features without permission
**Solution:** Check permission validation in middleware

### Issue: Import fails with "Column not found"
**Solution:** Verify column mapping in import component

### Issue: Role not applied after selection
**Solution:** Check if role is stored in both org-store and user-store

### Issue: Slow performance with many organizations
**Solution:** Add pagination and indexes to queries

---

## 📋 Checklist for New Feature

When adding new feature to multi-org system:

- [ ] Filter data by current organization
- [ ] Check user permissions
- [ ] Update organization_id in queries
- [ ] Test with multiple organizations
- [ ] Test with different roles
- [ ] Update API endpoints
- [ ] Update documentation
- [ ] Add unit tests
- [ ] Add integration tests

---

## 🔍 Debugging Tips

### Check Current State
```typescript
import { useOrgStore } from '@/store/org-store';
import { useUserStore } from '@/store/user-store';

const org = useOrgStore();
const user = useUserStore();

console.log('Current Org:', org.organizationId);
console.log('Current Role:', org.currentRole);
console.log('Permissions:', user.permissions);
```

### Check Middleware
```
Add console.logs in middleware.ts to see:
- Is user authenticated?
- Is org selected?
- Is role selected?
- Does user have permission?
```

### Check Database
```sql
-- Check user's organizations
SELECT * FROM organization_members 
WHERE user_id = 1;

-- Check member's roles
SELECT * FROM organization_member_roles 
WHERE organization_member_id = 1;

-- Check role permissions
SELECT * FROM nfk_permissions 
WHERE id IN (SELECT permission_id FROM role_permissions WHERE role_id = 1);
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `MULTI_ORG_MULTI_ROLE_ARCHITECTURE.md` | Complete architecture overview |
| `MULTI_ORG_API_CONTRACTS.md` | API endpoint specifications |
| `MULTI_ORG_DATABASE_SETUP.md` | Database schema and migrations |
| `MULTI_ORG_IMPLEMENTATION_CHECKLIST.md` | Implementation tasks |
| `MULTI_ORG_QUICK_REFERENCE.md` | This file |

---

## 🚨 Important Notes

1. **Role is Per-Organization**: User dapat memiliki role berbeda di setiap org
2. **No Role Switching**: User tidak bisa switch role tanpa logout
3. **Data Isolation**: Setiap org hanya melihat data mereka sendiri
4. **Setup Wizard**: Maksimal 5 menit untuk setup org baru
5. **Excel Import**: Format harus .xlsx, tidak support .csv atau .pdf (untuk sekarang)

---

## 📞 Support

Jika ada pertanyaan atau klarifikasi:
1. Review dokumentasi yang relevan
2. Check debugging tips di atas
3. Lihat sample queries di database setup
4. Tanyakan kepada tim development

---

**Last Updated: 2024-12-03**
**Version: 1.0**
