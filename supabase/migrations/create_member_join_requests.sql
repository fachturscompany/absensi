-- ============================================================
-- Table: member_join_requests
-- Purpose: Stores pending requests from users who want to
--          join an organization via inv_code.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.member_join_requests (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT      NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    requested_by    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status          TEXT        NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    reviewed_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index: cepat cari by organization + user + status
CREATE INDEX IF NOT EXISTS idx_member_join_requests_org_user
    ON public.member_join_requests (organization_id, requested_by);

-- Unique constraint: satu user hanya boleh punya 1 pending request per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_member_join_requests_active
    ON public.member_join_requests (organization_id, requested_by)
    WHERE (status = 'pending');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_member_join_requests_updated_at
    BEFORE UPDATE ON public.member_join_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: aktifkan, tapi biarkan service role (admin client) bypass
ALTER TABLE public.member_join_requests ENABLE ROW LEVEL SECURITY;

-- Policy: user hanya bisa lihat request miliknya sendiri
CREATE POLICY "Users can view own join requests"
    ON public.member_join_requests
    FOR SELECT
    USING (requested_by = auth.uid());
