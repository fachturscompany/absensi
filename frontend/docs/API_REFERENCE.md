# Referensi API

Dokumen ini memberikan gambaran umum mengenai API yang digunakan dalam proyek Presensi-New, mencakup Server Actions internal, Route API HTTP, dan integrasi layanan eksternal.

## Layanan Pihak Ketiga (External Services)

### 1. Supabase
Platform backend utama proyek ini (Backend-as-a-Service). Kami tidak mengakses database secara langsung via TCP, melainkan menggunakan SDK `@supabase/ssr` yang membungkus API berikut:

*   **Supabase Database (PostgreSQL via PostgREST)**
    *   **Fungsi**: Digunakan untuk seluruh operasi data relasional. SDK Supabase menerjemahkan query JavaScript menjadi panggilan API RESTful ke PostgREST layer di atas PostgreSQL.
    *   **Penggunaan**: CRUD data karyawan, absensi, cuti, dan struktur organisasi.
    *   **Lokasi Kode**: Hampir di semua file dalam folder `src/action/` (contoh: `supabase.from('table').select(...)`).

*   **Supabase Auth (GoTrue)**
    *   **Fungsi**: Menangani otentikasi, manajemen sesi (JWT), dan keamanan tingkat baris (RLS).
    *   **Penggunaan**: Login user, proteksi API, dan manajemen undangan user.
    *   **Admin API**: Digunakan secara khusus di `src/lib/email.ts` untuk fitur `inviteUserByEmail` (mengundang user ke dalam organisasi).

*   **Supabase Storage**
    *   **Fungsi**: Object storage untuk menyimpan file biner.
    *   **Penggunaan**: Menyimpan dan menyajikan foto profil pengguna (`profile_photo_url`) dan bukti pendukung lainnya.

### 2. Resend
Layanan email transaksional pihak ketiga.

*   **Email API**
    *   **Metode**: HTTP POST request langsung ke endpoint `https://api.resend.com/emails`.
    *   **Penggunaan**: Digunakan sebagai alternatif pengiriman email undangan (`src/lib/email.ts`) jika template email bawaan Supabase tidak mencukupi kebutuhan kustomisasi HTML/branding perusahaan.

---

## API Internal Proyek

### 1. Server Actions (`src/action/`)
Ini adalah "API internal" utama yang digunakan oleh Frontend (React Server Components & Client Components). Berjalan di sisi server Next.js.

*   **Attendance (`src/action/attendance.ts`)**
    *   `getAllAttendance`: Mengambil list absensi dengan pagination, filter tanggal, dan pencarian server-side.
    *   `createManualAttendance`: Input data absensi manual oleh admin.
    *   `updateAttendanceStatus`: Mengubah status kehadiran (misal: dari Alpha ke Izin).

*   **Dashboard (`src/action/dashboard.ts`)**
    *   `getDashboardStats`: Aggregator fungsi yang mengambil 17 metrik berbeda (total member, kehadiran hari ini, tren bulanan, dll) dalam satu kali pemanggilan untuk performa.

*   **Leaves (`src/action/leaves.ts`)**
    *   API untuk manajemen pengajuan cuti, persetujuan (approve/reject), dan perhitungan sisa kuota cuti.

*   **Members & Organization (`src/action/members.ts`, `organization.ts`)**
    *   Manajemen CRUD data karyawan dan pengaturan global perusahaan.

### 2. HTTP API Routes (`src/app/api/`)
Endpoint RESTful standar yang diekspos oleh Next.js. Berguna untuk akses dari luar aplikasi atau client-side fetching spesifik.

| Endpoint Path | Deskripsi |
|---------------|-----------|
| `/api/auth/*` | Menangani callback otentikasi Supabase (PKCE flow). |
| `/api/geo/[country]` | Mengambil data statis wilayah (Provinsi/Kota) untuk form alamat. |
| `/api/log-client-error` | Menerima laporan error (logs) dari sisi client browser. |
| `/api/dashboard/*` | Versi REST dari data dashboard (Stats, Active Members, dll). |
| `/api/attendance/*` | Endpoint operasional absensi (Init, Today summary). |

---

## Konfigurasi Lingkungan
Akses ke API diatur melalui Environment Variables (`src/lib/env.ts`):
*   `NEXT_PUBLIC_SUPABASE_URL`: URL Project Supabase.
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public API Key Supabase.
*   `SUPABASE_SERVICE_ROLE_KEY`: Secret Key untuk operasi admin (Backend only).
*   `RESEND_API_KEY`: API Key untuk layanan email Resend.
