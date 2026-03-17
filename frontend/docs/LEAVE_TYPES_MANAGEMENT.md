# Leave Types Management - Admin Feature

## Overview
Fitur ini memungkinkan admin untuk mengelola tipe cuti yang tersedia di organisasi melalui subpage khusus `/leaves/types`.

## Fitur Utama

### 1. **Halaman Kelola Tipe Cuti** (`/leaves/types`)
- Akses khusus untuk admin (ADMIN_ORG atau SUPER_ADMIN)
- Tampilan daftar lengkap semua tipe cuti
- Statistik tipe cuti (total, aktif, berbayar)
- Integrasi penuh dengan Supabase

### 2. **Operasi CRUD**
- ✅ **Create**: Tambah tipe cuti baru
- ✅ **Read**: Lihat semua tipe cuti dengan filter (All, Active, Inactive)
- ✅ **Update**: Edit konfigurasi tipe cuti
- ✅ **Delete**: Hapus tipe cuti (dengan validasi)

### 3. **Konfigurasi Tipe Cuti**
Setiap tipe cuti dapat dikonfigurasi dengan:
- **Code**: Kode unik (tidak bisa diubah setelah dibuat)
- **Name**: Nama tipe cuti
- **Description**: Deskripsi opsional
- **Days per Year**: Jumlah hari per tahun (0 = unlimited)
- **Minimum Days Notice**: Pemberitahuan minimum (hari)
- **Color Code**: Warna untuk identifikasi visual
- **Paid Leave**: Apakah cuti berbayar
- **Requires Approval**: Perlu persetujuan manager
- **Requires Document**: Perlu dokumen pendukung
- **Carry Forward**: Izinkan carry forward ke tahun berikutnya
- **Max Carry Forward Days**: Maksimal hari yang bisa di-carry forward
- **Active Status**: Status aktif/non-aktif

## Struktur File

```
src/
├── app/
│   └── leaves/
│       ├── page.tsx                    # Halaman utama leaves
│       └── types/
│           ├── page.tsx                # Halaman kelola tipe cuti
│           └── loading.tsx             # Loading state
├── components/
│   └── leave/
│       └── leave-type-manager.tsx      # Komponen utama CRUD
└── action/
    └── admin-leaves.ts                 # Server actions
```

## Integrasi Supabase

### Database Tables
- **leave_types**: Menyimpan konfigurasi tipe cuti
- **leave_balances**: Menyimpan saldo cuti karyawan

### RPC Functions
- `update_leave_balances_entitled`: Update saldo saat days_per_year berubah
- `initialize_leave_balances`: Buat saldo untuk semua member aktif

### Server Actions
```typescript
// Get all leave types
getOrganizationLeaveTypes(organizationId: number)

// Create new leave type
createLeaveType(organizationId: number, data: Partial<ILeaveType>)

// Update existing leave type
updateLeaveType(organizationId: number, leaveTypeId: number, data: Partial<ILeaveType>)

// Delete leave type
deleteLeaveType(organizationId: number, leaveTypeId: number)
```

## Alur Kerja

### 1. Membuat Tipe Cuti Baru
1. Admin mengakses `/leaves/types`
2. Klik tombol "Add Type"
3. Isi form konfigurasi
4. Submit → Server action `createLeaveType`
5. Sistem otomatis membuat saldo untuk semua member aktif
6. Real-time update via Supabase subscription

### 2. Mengubah Tipe Cuti
1. Klik tombol Edit pada tipe cuti
2. Ubah konfigurasi yang diperlukan
3. Submit → Server action `updateLeaveType`
4. Jika `days_per_year` berubah, saldo semua member diupdate via RPC

### 3. Menghapus Tipe Cuti
1. Klik tombol Delete
2. Konfirmasi penghapusan
3. Validasi: tidak bisa hapus jika ada request yang menggunakan
4. Alternatif: non-aktifkan tipe cuti

## Permission & Security

### Role-Based Access
- **ADMIN_ORG**: Full access
- **SUPER_ADMIN**: Full access
- **User biasa**: Tidak ada akses

### Permission Check
```typescript
const canManageLeaveTypes = 
  permissions?.includes('leaves:type:manage') || isAdmin;
```

### Supabase RLS
- Server actions menggunakan `checkAdminPermission()`
- Validasi organization_id untuk setiap operasi
- RPC functions dengan `SECURITY DEFINER`

## UI/UX Features

### 1. **Responsive Design**
- Mobile-friendly layout
- Adaptive grid untuk statistik
- Scrollable content area

### 2. **Real-time Updates**
- Supabase subscription untuk perubahan data
- Auto-reload saat ada perubahan
- Toast notification untuk feedback

### 3. **Form Validation**
- Zod schema validation
- Field-level error messages
- Disabled state saat loading

### 4. **Visual Indicators**
- Color picker dengan preset colors
- Badge untuk status (Active/Inactive, Paid, dll)
- Icon untuk setiap konfigurasi

### 5. **Tabs Navigation**
- All Types: Semua tipe cuti
- Active: Hanya yang aktif
- Inactive: Hanya yang non-aktif

## Error Handling

### Validasi
- ✅ Code harus unik
- ✅ Tidak bisa hapus tipe dengan existing requests
- ✅ Organization ID harus valid
- ✅ Permission check sebelum operasi

### Error Messages
- User-friendly error messages dalam Bahasa Indonesia
- Toast notifications untuk success/error
- Detailed logging untuk debugging

## Best Practices

### 1. **Data Normalization**
- Minimize data access cost
- Efficient query dengan proper joins

### 2. **Performance Optimization**
- Lazy loading untuk data besar
- Debounced search (jika ada)
- Optimized re-renders dengan useCallback

### 3. **Code Quality**
- TypeScript untuk type safety
- No hardcoded strings
- Reusable components
- Proper error boundaries

### 4. **Accessibility**
- Keyboard navigation support
- ARIA labels
- Focus management
- Screen reader friendly

## Testing Checklist

- [ ] Admin dapat membuat tipe cuti baru
- [ ] Saldo otomatis dibuat untuk member aktif
- [ ] Admin dapat mengubah konfigurasi
- [ ] Days per year update mempengaruhi saldo
- [ ] Tidak bisa hapus tipe dengan existing requests
- [ ] Non-admin tidak bisa akses halaman
- [ ] Real-time update bekerja
- [ ] Form validation berfungsi
- [ ] Mobile responsive
- [ ] Error handling proper

## Future Enhancements

### Planned Features
1. **Bulk Operations**: Import/export tipe cuti
2. **History Log**: Track perubahan konfigurasi
3. **Templates**: Template tipe cuti umum
4. **Advanced Filters**: Filter by paid/unpaid, approval required, dll
5. **Analytics**: Usage statistics per tipe cuti
6. **Multi-language**: Support untuk multilanguage

### Technical Improvements
1. **Caching**: Redis cache untuk performance
2. **Audit Trail**: Log semua perubahan
3. **Batch Updates**: Update multiple types sekaligus
4. **Version Control**: Track configuration versions

## Troubleshooting

### Issue: Saldo tidak otomatis dibuat
**Solution**: Check RPC function `initialize_leave_balances` dan pastikan member aktif

### Issue: Permission denied
**Solution**: Verify role dan permissions di `useUserStore`

### Issue: Real-time tidak update
**Solution**: Check Supabase subscription dan channel configuration

## Support & Documentation

- **Main Documentation**: `/docs/LEAVES_QUICK_START.md`
- **Changelog**: `/CHANGELOG_LEAVES.md`
- **API Reference**: `/docs/API_LEAVES.md`
- **Supabase Migrations**: `/supabase/migrations/`

---

**Last Updated**: 2025-11-18  
**Version**: 1.0.0  
**Author**: Development Team
