-- ============================================================
-- OPTIMIZED MEMBER_NEW TABLE
-- Schema ini disesuaikan dengan kebutuhan halaman member
-- Tabel baru untuk menggantikan organization_members dengan fitur import tanpa email
-- ============================================================

CREATE TABLE IF NOT EXISTS public.member_new (
  -- Primary Key
  id SERIAL NOT NULL,
  
  -- Foreign Keys (Required untuk relasi)
  organization_id INTEGER NOT NULL,
  user_id UUID NULL, -- NULLABLE karena bisa import tanpa email/user
  department_id INTEGER NULL, -- Group/Department
  position_id INTEGER NULL, -- Jabatan (optional)
  role_id INTEGER NULL, -- Role sistem (optional, bisa null)
  biodata_nik CHARACTER VARYING(16) NULL, -- Link ke biodata (untuk NIK, NISN, gender, religion)
  
  -- Employee Identifier
  employee_id CHARACTER VARYING(50) NULL, -- ID karyawan custom (bisa sama dengan NIK)
  
  -- Contact Information (denormalized untuk kemudahan query)
  email CHARACTER VARYING(255) NULL, -- Email address (bisa diisi langsung tanpa user account)
  
  -- Status & Metadata
  is_active BOOLEAN NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Employment Details (optional - untuk detail page, tidak ditampilkan di table)
  direct_manager_id INTEGER NULL,
  hire_date DATE NULL, -- Bisa NULL karena tidak wajib untuk import
  probation_end_date DATE NULL,
  contract_type CHARACTER VARYING(50) NULL,
  employment_status CHARACTER VARYING(50) NULL DEFAULT 'active'::CHARACTER VARYING,
  termination_date DATE NULL,
  work_location CHARACTER VARYING(255) NULL,
  
  -- Constraints
  CONSTRAINT member_new_pkey PRIMARY KEY (id),
  
  -- Unique Constraints
  CONSTRAINT member_new_organization_id_employee_id_key 
    UNIQUE (organization_id, employee_id),
  CONSTRAINT member_new_organization_id_user_id_key 
    UNIQUE (organization_id, user_id) 
    DEFERRABLE INITIALLY DEFERRED, -- DEFERRED untuk handle NULL values
  CONSTRAINT member_new_organization_id_email_key 
    UNIQUE (organization_id, email) 
    DEFERRABLE INITIALLY DEFERRED, -- DEFERRED untuk handle NULL values (satu email hanya satu member per organization)
  
  -- Foreign Key Constraints
  CONSTRAINT member_new_organization_id_fkey 
    FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT member_new_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES user_profiles(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT member_new_department_id_fkey 
    FOREIGN KEY (department_id) 
    REFERENCES departments(id) 
    ON DELETE SET NULL,
    
  CONSTRAINT member_new_position_id_fkey 
    FOREIGN KEY (position_id) 
    REFERENCES positions(id) 
    ON DELETE SET NULL,
    
  CONSTRAINT member_new_role_id_fkey 
    FOREIGN KEY (role_id) 
    REFERENCES system_roles(id) 
    ON DELETE SET NULL,
    
  CONSTRAINT member_new_biodata_nik_fkey 
    FOREIGN KEY (biodata_nik) 
    REFERENCES biodata(nik) 
    ON DELETE SET NULL,
    
  CONSTRAINT member_new_direct_manager_id_fkey 
    FOREIGN KEY (direct_manager_id) 
    REFERENCES member_new(id) 
    ON DELETE SET NULL,
  
  -- Check Constraints
  CONSTRAINT member_new_user_or_biodata_check 
    CHECK (
      user_id IS NOT NULL OR 
      employee_id IS NOT NULL OR 
      biodata_nik IS NOT NULL
    ), -- Minimal salah satu harus ada
  
  -- Email format validation (jika email tidak NULL, harus valid format)
  CONSTRAINT member_new_email_format_check 
    CHECK (
      email IS NULL OR 
      email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ) -- Validasi format email jika email diisi
)
TABLESPACE pg_default;

-- ============================================================
-- INDEXES untuk optimasi query
-- ============================================================

-- Index untuk filter by organization (paling sering digunakan)
CREATE INDEX IF NOT EXISTS idx_member_new_org_id 
  ON public.member_new 
  USING btree (organization_id) 
  TABLESPACE pg_default;

-- Index untuk filter by user
CREATE INDEX IF NOT EXISTS idx_member_new_user_id 
  ON public.member_new 
  USING btree (user_id) 
  TABLESPACE pg_default
  WHERE user_id IS NOT NULL;

-- Index untuk filter by department (group)
CREATE INDEX IF NOT EXISTS idx_member_new_department 
  ON public.member_new 
  USING btree (department_id) 
  TABLESPACE pg_default
  WHERE department_id IS NOT NULL;

-- Index untuk filter by role
CREATE INDEX IF NOT EXISTS idx_member_new_role_id 
  ON public.member_new 
  USING btree (role_id) 
  TABLESPACE pg_default
  WHERE role_id IS NOT NULL;

-- Index untuk filter by biodata_nik
CREATE INDEX IF NOT EXISTS idx_member_new_biodata_nik 
  ON public.member_new 
  USING btree (biodata_nik) 
  TABLESPACE pg_default
  WHERE biodata_nik IS NOT NULL;

-- Index untuk filter by employee_id
CREATE INDEX IF NOT EXISTS idx_member_new_employee_id 
  ON public.member_new 
  USING btree (employee_id) 
  TABLESPACE pg_default
  WHERE employee_id IS NOT NULL;

-- Index untuk filter/search by email
CREATE INDEX IF NOT EXISTS idx_member_new_email 
  ON public.member_new 
  USING btree (email) 
  TABLESPACE pg_default
  WHERE email IS NOT NULL;

-- Composite index untuk query umum (organization + active status)
CREATE INDEX IF NOT EXISTS idx_member_new_active 
  ON public.member_new 
  USING btree (organization_id, is_active) 
  TABLESPACE pg_default
  WHERE is_active = true;

-- Composite index untuk user + organization lookup
CREATE INDEX IF NOT EXISTS idx_member_new_user_org 
  ON public.member_new 
  USING btree (user_id, organization_id) 
  TABLESPACE pg_default
  WHERE user_id IS NOT NULL;

-- Composite index untuk email + organization lookup (untuk unique constraint dan query)
CREATE INDEX IF NOT EXISTS idx_member_new_email_org 
  ON public.member_new 
  USING btree (organization_id, email) 
  TABLESPACE pg_default
  WHERE email IS NOT NULL;

-- Index untuk position lookup
CREATE INDEX IF NOT EXISTS idx_member_new_position 
  ON public.member_new 
  USING btree (position_id) 
  TABLESPACE pg_default
  WHERE position_id IS NOT NULL;

-- Index untuk manager lookup
CREATE INDEX IF NOT EXISTS idx_member_new_manager 
  ON public.member_new 
  USING btree (direct_manager_id) 
  TABLESPACE pg_default
  WHERE direct_manager_id IS NOT NULL;

-- Index untuk sorting by created_at (newest/oldest)
CREATE INDEX IF NOT EXISTS idx_member_new_created_at 
  ON public.member_new 
  USING btree (created_at DESC) 
  TABLESPACE pg_default;

-- ============================================================
-- TRIGGER untuk update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_member_new_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_member_new_updated_at
  BEFORE UPDATE ON public.member_new
  FOR EACH ROW
  EXECUTE FUNCTION update_member_new_updated_at();

-- ============================================================
-- COMMENTS untuk dokumentasi
-- ============================================================

COMMENT ON TABLE public.member_new IS 
  'Tabel untuk menyimpan data member dalam organisasi. 
   Support import tanpa email (user_id bisa NULL jika menggunakan biodata_nik).';

COMMENT ON COLUMN public.member_new.user_id IS 
  'User ID dari user_profiles. Bisa NULL jika member di-import tanpa email/user account.';

COMMENT ON COLUMN public.member_new.biodata_nik IS 
  'Link ke tabel biodata via NIK. Digunakan untuk mengambil data NIK, NISN, gender, religion.';

COMMENT ON COLUMN public.member_new.employee_id IS 
  'ID karyawan custom. Bisa sama dengan NIK atau custom ID.';

COMMENT ON COLUMN public.member_new.email IS 
  'Email address member. Bisa diisi langsung saat import tanpa perlu membuat user account. 
   Jika user_id ada, email ini bisa sync dengan user_profiles.email atau bisa berbeda.
   Email harus unique per organization (satu email hanya boleh digunakan sekali per organization).
   Email harus valid format jika diisi (validated via CHECK constraint).';

COMMENT ON COLUMN public.member_new.department_id IS 
  'Reference ke departments (group).';

COMMENT ON COLUMN public.member_new.role_id IS 
  'Reference ke system_roles untuk permission/akses.';

