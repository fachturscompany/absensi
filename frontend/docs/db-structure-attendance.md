# Database Structure Reference — Attendance Domain

Dokumen ini merangkum struktur tabel dan indeks berdasarkan hasil inspeksi (gabungan foto) untuk memandu query yang benar dan optimal.

## Penyusunan Foto (Urutan/Gabungan)
- **Foto 3 → 4 → 5**: Kolom-kolom tabel `attendance_records` (bersambung vertikal)
- **Foto 6 → 7**: Kolom-kolom tabel `organization_members` (bersambung vertikal)
- **Foto 8 → 9**: Kolom-kolom tabel `organizations` (bersambung vertikal)
- **Foto 13 ↔ 14**: Daftar indeks `attendance_records` (bersambung horizontal)
- **Foto 15 → 16**: Daftar indeks `organization_members` (bersambung vertikal)

---

## Tabel Inti dan Relasi

### 1) organizations
Kolom penting (ringkas):
- `id` (PK, int)
- `code`, `name`, `legal_name`
- `timezone` (default `'UTC'`), `time_format` (contoh `'24h'`)
- Status: `is_active`, `is_suspended`
- Metadata: `inv_code`, `created_at`, `updated_at`, dll.

### 2) organization_members
Kolom penting:
- `id` (PK, int)
- `organization_id` (FK → `organizations.id`, ON DELETE CASCADE)
- `user_id` (FK → `user_profiles.id`, ON DELETE CASCADE)
- `department_id`, `position_id`, `employment_status`, `is_active` (default `true`), dsb.

Constraint/Index relevan:
- `FOREIGN KEY (organization_id) REFERENCES organizations(id)`
- Composite/Unique/Partial index (subset):
  - `idx_org_members_org_id` → (organization_id)
  - `idx_org_members_composite` → (organization_id, user_id, is_active)
  - `idx_org_members_active` → WHERE (is_active = true)
  - Lainnya: by department, position, manager, email, dsb.

### 3) attendance_records
Kolom penting:
- `id` (PK, int)
- `organization_member_id` (FK → `organization_members.id`)
- `attendance_date` (date) — NOT NULL
- Waktu aktual: `actual_check_in`, `actual_check_out`
- Perangkat: `check_in_device_id`, `check_out_device_id`
- Status: `status`, `validation_status` (default `'pending'`), `validated_by`, `validated_at`
- Durasi: `work_duration_minutes`, `late_minutes`, `early_leave_minutes`, dsb.
- Audit: `created_at`, `updated_at`

Constraint/Index relevan:
- `UNIQUE (organization_member_id, attendance_date)`
- Indeks (subset dari foto 13–14):
  - `idx_attendance_records_member_date` → (organization_member_id, attendance_date)
  - `idx_attendance_composite` → (organization_member_id, attendance_date, status)
  - `idx_attendance_records_created_at` → (created_at)
  - Indeks spesifik lain: by device, by application, by date (desc), dsb.

> Penting: `attendance_records` TIDAK memiliki kolom `organization_id`.
> Filtrasi berbasis organisasi harus dilakukan melalui `organization_member_id` → `organization_members.organization_id`.

---

## Pola Query yang Benar (Guideline)

- **Filter by Organization**
  - Ambil `memberIds` dari `organization_members` yang `organization_id = :orgId` (opsional: `AND is_active = true`).
  - Query `attendance_records` dengan `organization_member_id IN (memberIds)`.
  - Untuk search nama, saring `memberIds` menggunakan tabel relasi ke `user_profiles` (lihat bagian Search).

- **Search Nama Cepat**
  - Gunakan kolom generated/denormalized `user_profiles.search_name` + index trigram (GIN) untuk `ILIKE`/trigram match.
  - Langkah: filter `organization_members` (orgId) + `user_profiles.search_name ILIKE` → hasil `memberIds` → pakai pada `attendance_records`.

- **Sorting/Range**
  - Sort utama: `attendance_date DESC`, fallback `created_at DESC`, dengan batas `range(from, to)` untuk paginasi offset.
  - Untuk skala besar, disarankan keyset pagination (cursor) memakai `(attendance_date, actual_check_in, created_at, id)`.

- **Optimasi yang Didukung Index Saat Ini**
  - Filter cepat via `(organization_member_id, attendance_date)` dan `(organization_member_id, attendance_date, status)`.
  - Jika sering sort by `created_at`, indeks `created_at` sudah ada.
  - Jika butuh, pertimbangkan indeks tambahan sesuai pola akses aktual, contoh:
    - `(organization_member_id, created_at DESC)`

---

## Implikasi ke Kode (`src/action/attendance.ts`)

- Jangan filter `attendance_records` dengan `organization_id` (kolom ini tidak ada).
- Lakukan:
  1. Ambil `memberIdsBase = SELECT id FROM organization_members WHERE organization_id = :orgId [AND is_active = true]`.
  2. Jika ada `search`, ambil `memberIdsSearch ⊆ memberIdsBase` dari join ke `user_profiles.search_name`.
  3. Gunakan `memberIdsToUse = memberIdsSearch ?? memberIdsBase`.
  4. Count/List pada `attendance_records` dengan `organization_member_id IN memberIdsToUse` + filter tanggal/status.

> Dengan indeks yang ada, pola IN di atas tetap efisien untuk ukuran org menengah. Untuk org sangat besar, pertimbangkan join langsung dengan foreignTable di Supabase atau keyset pagination untuk meminimalkan biaya.

---

## Ringkasan
- Sumber kebenaran organisasi berada di `organization_members.organization_id`.
- `attendance_records` direlasikan via `organization_member_id` (bukan `organization_id`).
- Indeks yang ada sudah cukup baik untuk pola filter `(organization_member_id, attendance_date[, status])` + `created_at`.
- Gunakan `search_name` + GIN trigram untuk pencarian nama yang cepat.

Dokumen ini bisa di-embed agar menjadi referensi tetap untuk tim.
