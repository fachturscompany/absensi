# 📋 Leave Management Dashboard - Update Documentation

**Date**: November 18, 2025  
**Version**: 2.0.0  
**Status**: ✅ Completed

---

## 🎯 Overview

Perombakan lengkap halaman Leave Management menjadi dashboard komprehensif dengan fitur admin dan user yang terpisah, real-time updates, dan visualisasi data yang dinamis.

---

## 🚀 Fitur Baru

### 1. **Dashboard dengan Statistics Cards**
- 4 card statistik dinamis yang berbeda untuk admin dan user
- **Admin View**:
  - Total Requests
  - Approved Requests
  - Employees on Leave
  - Upcoming Leaves
- **User View**:
  - Leave Balance
  - Pending Requests
  - Approved Leaves
  - Leave Types Available

### 2. **Tabs Navigation**
- **Overview**: Dashboard dengan chart dan recent requests
- **Requests**: Daftar lengkap semua leave requests
- **Calendar** (Admin only): Kalender visual untuk melihat leave schedule
- **Analytics** (Admin only): Analisis mendalam dengan berbagai chart

### 3. **Leave Type Management (Admin)**
- Dialog modal untuk manage leave types
- CRUD operations lengkap (Create, Read, Update, Delete)
- Form validation dengan Zod
- Color picker untuk visual differentiation
- Tabs untuk filter (All, Active, Inactive)
- Responsive dialog dengan max-height 85vh

### 4. **Real-time Updates**
- Supabase Realtime subscription untuk `leave_requests` table
- Supabase Realtime subscription untuk `leave_balances` table
- Auto-reload data saat ada perubahan
- Toast notifications untuk user feedback

### 5. **Approve/Reject Workflow (Admin)**
- Inline approve/reject buttons untuk pending requests
- Confirmation dialog dengan reason input
- Comments untuk approval
- Required reason untuk rejection
- Update balance otomatis setelah approval/rejection

### 6. **Visualisasi Data**
- **Status Distribution Chart**: Bar chart untuk status requests
- **Monthly Trend Chart**: Line chart untuk trend bulanan
- **Leave Type Distribution**: Pie chart untuk distribusi tipe cuti
- **Department Distribution**: Bar chart untuk distribusi per department
- **Detailed Analytics**: Grid cards dengan metrics detail

### 7. **Calendar View (Admin)**
- Full calendar dengan visual indicators
- Color-coded leave days berdasarkan leave type
- Employee initials pada leave days
- Weekend highlighting
- Today indicator
- Monthly navigation
- Summary statistics

---

## 📁 File Structure

```
src/
├── app/
│   └── leaves/
│       ├── page.tsx                    # ✅ UPDATED - Main dashboard
│       ├── loading.tsx                 # Existing
│       └── new/
│           ├── page.tsx                # Existing
│           └── loading.tsx             # Existing
│
├── components/
│   └── leave/
│       ├── leave-type-manager.tsx      # ✅ NEW - Manage leave types
│       ├── leave-request-list.tsx      # ✅ NEW - List with approve/reject
│       ├── leave-calendar.tsx          # ✅ NEW - Calendar view
│       ├── leave-analytics.tsx         # ✅ NEW - Charts & analytics
│       └── leave-balance-card.tsx      # Existing
│
├── action/
│   ├── leaves.ts                       # Existing - User actions
│   └── admin-leaves.ts                 # ✅ NEW - Admin actions
│
└── store/
    ├── user-store.ts                   # ✅ UPDATED - Added role
    └── org-store.ts                    # ✅ UPDATED - Added organizationId
```

---

## 🔧 Technical Implementation

### 1. **Server Actions (admin-leaves.ts)**

#### Functions:
```typescript
// Statistics
getLeaveStatistics(organizationId: number)

// Leave Requests
getAllLeaveRequests(organizationId: number)

// Leave Types CRUD
getOrganizationLeaveTypes(organizationId: number)
createLeaveType(organizationId: number, data: Partial<ILeaveType>)
updateLeaveType(organizationId: number, leaveTypeId: number, data: Partial<ILeaveType>)
deleteLeaveType(organizationId: number, leaveTypeId: number)

// Approval Workflow
approveLeaveRequest(organizationId: number, requestId: number, comments?: string)
rejectLeaveRequest(organizationId: number, requestId: number, reason: string)
```

#### Permission Check:
```typescript
async function checkAdminPermission(organizationId: number) {
  // Verify user is ADMIN_ORG or SUPER_ADMIN
  // Return hasPermission boolean
}
```

### 2. **Real-time Subscription**

```typescript
useEffect(() => {
  const supabase = createClient();
  
  const channel = supabase
    .channel('leave-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'leave_requests'
    }, (payload) => {
      loadData(); // Reload when changes occur
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'leave_balances'
    }, (payload) => {
      loadData();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [loadData]);
```

### 3. **Role-based Rendering**

```typescript
const { role, permissions } = useUserStore();
const isAdmin = role === 'ADMIN_ORG' || role === 'SUPER_ADMIN';
const canManageLeaveTypes = permissions?.includes('leaves:type:manage') || isAdmin;
const canApproveRequests = permissions?.includes('leaves:approval:create') || isAdmin;

// Conditional rendering
{isAdmin && (
  <TabsTrigger value="calendar">Calendar</TabsTrigger>
)}
```

### 4. **Responsive Dialog**

```typescript
<DialogContent className="max-w-4xl max-h-[85vh]">
  <DialogHeader>
    <DialogTitle>Manage Leave Types</DialogTitle>
  </DialogHeader>
  <ScrollArea className="h-[calc(85vh-120px)] pr-4">
    {/* Content with scroll */}
  </ScrollArea>
</DialogContent>
```

---

## 🎨 UI/UX Improvements

### 1. **Consistent Theme**
- Menggunakan color scheme dari website
- Dark mode compatible
- Consistent spacing dan typography

### 2. **Responsive Design**
- Mobile-first approach
- Grid layout yang adaptive
- Collapsible sidebar support

### 3. **Loading States**
- Skeleton loaders untuk semua components
- Loading spinners untuk actions
- Disabled states saat loading

### 4. **Error Handling**
- Toast notifications untuk errors
- Inline error messages
- Validation feedback

### 5. **Accessibility**
- Proper ARIA labels
- Keyboard navigation
- Screen reader support

---

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                        │
│  Dashboard → Tabs → Components                           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              ZUSTAND STORES                              │
│  • useUserStore (role, permissions)                      │
│  • useOrgStore (organizationId)                          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              SERVER ACTIONS                              │
│  User: leaves.ts                                         │
│  Admin: admin-leaves.ts                                  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              SUPABASE                                    │
│  • Database Queries                                      │
│  • Real-time Subscriptions                              │
│  • RLS Policies                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Security

### 1. **Permission Checks**
- Server-side validation untuk semua admin actions
- Role-based access control (RBAC)
- Organization isolation

### 2. **Data Validation**
- Zod schemas untuk form validation
- Server-side validation
- SQL injection prevention (Supabase)

### 3. **RLS Policies** (Recommended)
```sql
-- Users see only their own requests
CREATE POLICY "Users see own requests" ON leave_requests
  FOR SELECT
  USING (
    organization_member_id IN (
      SELECT id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Admins see all org requests
CREATE POLICY "Admins see org requests" ON leave_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN system_roles sr ON om.role_id = sr.id
      WHERE om.user_id = auth.uid()
        AND sr.code IN ('ADMIN_ORG', 'SUPER_ADMIN')
    )
  );
```

---

## 🧪 Testing Checklist

### User Flow:
- [ ] View leave balance
- [ ] View leave requests history
- [ ] Create new leave request
- [ ] Cancel pending request
- [ ] Receive real-time updates

### Admin Flow:
- [ ] View organization statistics
- [ ] View all employee requests
- [ ] Approve leave request
- [ ] Reject leave request with reason
- [ ] Create new leave type
- [ ] Edit existing leave type
- [ ] Delete unused leave type
- [ ] View calendar
- [ ] View analytics

### Real-time:
- [ ] Updates when request created
- [ ] Updates when request approved
- [ ] Updates when request rejected
- [ ] Updates when balance changes

### Responsive:
- [ ] Desktop view (1920px)
- [ ] Tablet view (768px)
- [ ] Mobile view (375px)
- [ ] Dialog height on small screens

---

## 🚀 Deployment Notes

### 1. **Environment Variables**
Pastikan sudah set:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2. **Database Setup**
Pastikan tables sudah ada:
- `leave_types`
- `leave_requests`
- `leave_balances`
- `leave_approvals`
- `organization_members`
- `user_profiles`
- `departments`
- `positions`

### 3. **RPC Functions**
Buat Supabase RPC functions:
```sql
-- Update pending days in balance
CREATE OR REPLACE FUNCTION update_leave_balance_pending(
  p_member_id INTEGER,
  p_leave_type_id INTEGER,
  p_year INTEGER,
  p_days NUMERIC,
  p_operation TEXT
) RETURNS VOID AS $$
BEGIN
  IF p_operation = 'add' THEN
    UPDATE leave_balances
    SET pending_days = pending_days + p_days,
        remaining_days = remaining_days - p_days
    WHERE organization_member_id = p_member_id
      AND leave_type_id = p_leave_type_id
      AND year = p_year;
  ELSE
    UPDATE leave_balances
    SET pending_days = pending_days - p_days,
        remaining_days = remaining_days + p_days
    WHERE organization_member_id = p_member_id
      AND leave_type_id = p_leave_type_id
      AND year = p_year;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Approve leave balance
CREATE OR REPLACE FUNCTION approve_leave_balance(
  p_member_id INTEGER,
  p_leave_type_id INTEGER,
  p_year INTEGER,
  p_days NUMERIC
) RETURNS VOID AS $$
BEGIN
  UPDATE leave_balances
  SET pending_days = pending_days - p_days,
      used_days = used_days + p_days
  WHERE organization_member_id = p_member_id
    AND leave_type_id = p_leave_type_id
    AND year = p_year;
END;
$$ LANGUAGE plpgsql;

-- Update entitled days
CREATE OR REPLACE FUNCTION update_leave_balances_entitled(
  p_leave_type_id INTEGER,
  p_year INTEGER,
  p_new_entitled NUMERIC
) RETURNS VOID AS $$
BEGIN
  UPDATE leave_balances
  SET entitled_days = p_new_entitled,
      remaining_days = p_new_entitled + carried_forward_days - used_days - pending_days
  WHERE leave_type_id = p_leave_type_id
    AND year = p_year;
END;
$$ LANGUAGE plpgsql;
```

### 4. **Real-time Setup**
Enable Realtime di Supabase:
```sql
-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE leave_balances;
```

---

## 📝 Future Enhancements

### Phase 2:
- [ ] Document upload untuk leave requests
- [ ] Email notifications
- [ ] Multi-level approval workflow
- [ ] Leave delegation
- [ ] Public holidays management
- [ ] Leave reports export (PDF, Excel)

### Phase 3:
- [ ] Mobile app integration
- [ ] Push notifications
- [ ] Advanced analytics dengan AI
- [ ] Leave forecasting
- [ ] Integration dengan payroll

---

## 🐛 Known Issues

1. **Real-time Subscription**: Perlu testing di production untuk ensure stability
2. **RLS Policies**: Belum fully implemented, perlu enable di production
3. **Notification System**: Belum ada email/push notifications

---

## 📞 Support

Untuk pertanyaan atau issues:
1. Check dokumentasi ini
2. Review code comments
3. Test di development environment
4. Contact team lead

---

**Last Updated**: November 18, 2025  
**Author**: AI Assistant  
**Reviewed By**: Pending
