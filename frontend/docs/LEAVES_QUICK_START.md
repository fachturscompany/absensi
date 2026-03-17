# 🚀 Leave Management - Quick Start Guide

> Panduan cepat untuk memulai menggunakan Leave Management Dashboard yang baru

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [User Guide](#user-guide)
4. [Admin Guide](#admin-guide)
5. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Leave Management Dashboard adalah sistem manajemen cuti yang komprehensif dengan fitur:

### **Untuk User (Employee)**
- ✅ View leave balance
- ✅ Create leave requests
- ✅ Track request status
- ✅ View history
- ✅ Real-time updates

### **Untuk Admin**
- ✅ Approve/reject requests
- ✅ Manage leave types
- ✅ View organization statistics
- ✅ Calendar view
- ✅ Analytics dashboard

---

## 🛠️ Setup

### 1. Database Setup

Jalankan migration untuk RPC functions:

```bash
# Via Supabase CLI
supabase db push

# Atau via psql
psql -d your_database -f supabase/migrations/create_leave_rpc_functions.sql
```

### 2. Enable Realtime

Di Supabase Dashboard:
1. Navigate to **Database → Replication**
2. Enable realtime untuk tables:
   - ✅ `leave_requests`
   - ✅ `leave_balances`

### 3. Environment Variables

Pastikan `.env.local` sudah configured:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Initialize User Session

Saat user login, set role dan organizationId:

```typescript
import { useUserStore } from '@/store/user-store';
import { useOrgStore } from '@/store/org-store';

// After successful authentication
const userStore = useUserStore.getState();
const orgStore = useOrgStore.getState();

userStore.setRole(user.role); // 'USER', 'ADMIN_ORG', or 'SUPER_ADMIN'
userStore.setPermissions(user.permissions);
orgStore.setOrganizationId(user.organization_id);
```

---

## 👤 User Guide

### Accessing Leave Dashboard

Navigate to: `/leaves`

### View Leave Balance

Dashboard menampilkan:
- **Leave Balance**: Total sisa cuti
- **Pending Requests**: Request yang menunggu approval
- **Approved Leaves**: Total cuti yang disetujui
- **Leave Types**: Jenis cuti yang tersedia

### Create Leave Request

1. Click **"Request Leave"** button
2. Fill form:
   - Select leave type
   - Choose start & end date
   - Add reason (min 10 characters)
   - Optional: Emergency contact
3. Review total days calculation
4. Click **"Submit Request"**

### Track Request Status

Requests ditampilkan dengan status badge:
- 🟡 **Pending**: Menunggu approval
- 🟢 **Approved**: Disetujui
- 🔴 **Rejected**: Ditolak
- ⚫ **Cancelled**: Dibatalkan

### Real-time Updates

Dashboard akan otomatis update saat:
- Request status berubah
- Balance berubah
- Ada request baru

---

## 👨‍💼 Admin Guide

### Accessing Admin Features

Admin memiliki akses ke semua tabs:
- **Overview**: Dashboard dengan statistics
- **Requests**: Semua leave requests
- **Calendar**: Visual calendar view
- **Analytics**: Charts dan detailed metrics

### Approve/Reject Requests

#### Approve:
1. Find pending request
2. Click **"Approve"** button
3. Add comments (optional)
4. Confirm approval

#### Reject:
1. Find pending request
2. Click **"Reject"** button
3. **Add reason** (required)
4. Confirm rejection

### Manage Leave Types

1. Click **"Manage Types"** button
2. Dialog akan terbuka dengan list leave types

#### Create New Leave Type:
1. Click **"Add Type"**
2. Fill form:
   ```
   - Code: ANNUAL (unique identifier)
   - Name: Annual Leave
   - Description: Regular annual leave
   - Days per Year: 12 (0 for unlimited)
   - Minimum Notice: 7 days
   - Color: Choose color
   - Switches:
     ✓ Paid Leave
     ✓ Requires Approval
     ✓ Allow Carry Forward
   ```
3. Click **"Create"**

#### Edit Leave Type:
1. Click **Edit** icon pada leave type
2. Update fields
3. Click **"Update"**

#### Delete Leave Type:
1. Click **Trash** icon
2. Click **"Confirm"** (akan muncul warning jika ada requests)

### View Calendar

Calendar menampilkan:
- Color-coded leave days
- Employee initials
- Weekend highlighting
- Today indicator
- Monthly navigation

### View Analytics

Analytics tab menampilkan:
- **Status Distribution**: Pie chart
- **Monthly Trend**: Line chart
- **Leave Type Distribution**: Bar chart
- **Department Distribution**: Bar chart
- **Detailed Metrics**: Grid cards

---

## 🔧 Troubleshooting

### Issue: Real-time updates tidak berfungsi

**Solution:**
1. Check Supabase Realtime enabled
2. Verify subscription di browser console
3. Check network connection
4. Refresh page

### Issue: Permission denied saat approve/reject

**Solution:**
1. Verify user role adalah ADMIN_ORG atau SUPER_ADMIN
2. Check permissions di user store
3. Verify organizationId di org store

### Issue: Leave balance tidak update

**Solution:**
1. Check RPC functions sudah di-deploy
2. Verify database connection
3. Check console untuk errors
4. Manual refresh page

### Issue: Dialog terlalu tinggi di mobile

**Solution:**
- Dialog sudah set max-height: 85vh
- Gunakan ScrollArea untuk content
- Jika masih issue, check viewport height

### Issue: Charts tidak render

**Solution:**
1. Check data tersedia
2. Verify requests array tidak empty
3. Check browser console untuk errors
4. Clear cache dan reload

---

## 📱 Mobile Usage

### Responsive Features:
- ✅ Touch-friendly buttons
- ✅ Collapsible sidebar
- ✅ Responsive grid layout
- ✅ Scrollable dialogs
- ✅ Adaptive charts

### Best Practices:
- Use landscape mode untuk calendar view
- Swipe untuk navigate tabs
- Long press untuk context menu (future)

---

## 🎨 Customization

### Change Theme Colors

Edit leave type colors:
1. Go to **Manage Types**
2. Edit leave type
3. Choose new color dari color picker
4. Save changes

### Adjust Statistics Cards

Modify `src/app/leaves/page.tsx`:
```typescript
const calculateStats = () => {
  // Customize calculation logic here
}
```

### Add Custom Charts

Create new analytics type di `src/components/leave/leave-analytics.tsx`:
```typescript
if (type === 'custom') {
  // Your custom chart logic
}
```

---

## 🔐 Security Best Practices

### For Admins:
1. ✅ Always provide reason saat reject
2. ✅ Review request details sebelum approve
3. ✅ Regularly audit leave types
4. ✅ Monitor analytics untuk anomalies

### For Users:
1. ✅ Provide detailed reason untuk leave
2. ✅ Submit requests dengan advance notice
3. ✅ Check balance sebelum request
4. ✅ Cancel requests jika tidak jadi

---

## 📊 Performance Tips

### For Better Performance:
1. ✅ Use filters untuk large datasets
2. ✅ Limit date ranges di analytics
3. ✅ Close unused tabs
4. ✅ Clear browser cache periodically

### Optimization:
- Data di-cache dengan TanStack Query
- Real-time updates efficient
- Lazy loading untuk heavy components
- Memoized calculations

---

## 🆘 Support

### Need Help?

1. **Documentation**: Check `docs/LEAVES_DASHBOARD_UPDATE.md`
2. **Changelog**: Review `CHANGELOG_LEAVES.md`
3. **Code Comments**: Read inline comments
4. **Team**: Contact development team

### Report Issues:

Include:
- Screenshot
- Browser & version
- Steps to reproduce
- Error messages
- User role

---

## 📚 Additional Resources

- [Full Documentation](./LEAVES_DASHBOARD_UPDATE.md)
- [Changelog](../CHANGELOG_LEAVES.md)
- [Database Schema](./DOCUMENTATION.md#database-schema)
- [API Reference](./DOCUMENTATION.md#api-routes)

---

**Last Updated**: November 18, 2025  
**Version**: 2.0.0  
**Status**: ✅ Ready to Use
