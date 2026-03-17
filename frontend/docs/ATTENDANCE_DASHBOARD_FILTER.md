# Attendance Dashboard - All/Me Filter

## Deskripsi
Fitur filter "All" dan "Me" di halaman Attendance Dashboard yang memungkinkan pengguna untuk melihat data semua karyawan atau hanya data pribadi mereka sendiri.

## URL Structure
- **All View**: `/attendance/dashboard` atau `/attendance/dashboard?view=all`
- **Me View**: `/attendance/dashboard?view=me`

## Perubahan yang Dilakukan

### 1. Import Dependencies
Menambahkan komponen dan hooks yang diperlukan:
- `Tabs`, `TabsList`, `TabsTrigger` dari `@/components/ui/tabs`
- `useRouter`, `useSearchParams` dari `next/navigation`

### 2. State Management
- `view` state: Melacak mode aktif ('all' atau 'me')
- Sinkronisasi dengan URL query parameters
- Handler `handleViewChange` untuk update URL saat filter berubah

### 3. UI Components

#### Filter Tabs
Tabs component di header dashboard yang memungkinkan toggle antara "All" dan "Me":
```tsx
<Tabs value={view} onValueChange={handleViewChange}>
  <TabsList className="grid w-[200px] grid-cols-2">
    <TabsTrigger value="all">All</TabsTrigger>
    <TabsTrigger value="me">Me</TabsTrigger>
  </TabsList>
</Tabs>
```

#### Summary Cards
- **All View**: Menampilkan Total Pegawai, Hadir, Terlambat, Izin/Sakit
- **Me View**: Menampilkan Status Saya (personal status), menyembunyikan statistik organisasi

#### Activity Table
- **All View**: 
  - Menampilkan semua aktivitas karyawan
  - Kolom: Nama Staff, Divisi, Jabatan, Aktivitas
  - Pagination control
  
- **Me View**:
  - Menampilkan hanya aktivitas user yang login
  - Kolom: Aktivitas, Waktu
  - Format lebih sederhana dan personal

#### Right Panel Widgets

**Untuk All View:**
- Staff Status Chart (Donut chart dengan status karyawan)
- Daftar Pengajuan (Permission requests dari semua karyawan)

**Untuk Me View:**
- Performance Card (Kartu performa personal):
  - Jam Kerja Hari Ini
  - Jam Kerja Minggu Ini
  - Kehadiran Bulan Ini
  - Keterlambatan
  - Link ke detail attendance

### 4. Widget Visibility Logic
Widget-widget tertentu hanya ditampilkan berdasarkan context:
- Summary cards untuk statistik organisasi: `view === 'all'`
- Performance metrics personal: `view === 'me'`
- Charts dan lists global: `view === 'all'`

## Cara Penggunaan

### Untuk Developer
1. Data saat ini menggunakan dummy data
2. Untuk implementasi real:
   - Ambil user ID dari session/auth
   - Filter data attendance berdasarkan user ID saat `view === 'me'`
   - Ambil real-time performance metrics dari API

### Untuk User
1. Buka halaman `/attendance/dashboard`
2. Klik tab "All" untuk melihat data semua karyawan
3. Klik tab "Me" untuk melihat data pribadi
4. URL akan update otomatis dengan query parameter

## Contoh API Implementation (Future)

```typescript
// Fetch data berdasarkan view
const fetchDashboardData = async (view: 'all' | 'me') => {
  if (view === 'me') {
    // Fetch personal data
    const response = await fetch('/api/dashboard/me')
    return response.json()
  } else {
    // Fetch all data
    const response = await fetch('/api/dashboard/all')
    return response.json()
  }
}
```

## Testing
1. Navigate ke `/attendance/dashboard`
2. Verifikasi default view adalah "All"
3. Klik tab "Me"
4. Verifikasi URL berubah ke `/attendance/dashboard?view=me`
5. Verifikasi konten berubah menjadi personal view
6. Klik tab "All" lagi
7. Verifikasi URL kembali ke `/attendance/dashboard`
8. Verifikasi konten kembali ke all view

## Future Improvements
1. Integrasi dengan real user authentication
2. Fetch real data dari backend API
3. Tambahkan loading states
4. Error handling
5. Persistent preference (simpan pilihan user di localStorage)
6. Add more personal metrics untuk "Me" view
7. Export personal attendance report



