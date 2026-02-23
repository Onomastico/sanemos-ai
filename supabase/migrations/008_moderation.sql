-- ============================================================
-- sanemos.ai — Phase 8: Resource Moderation & Therapist Links
-- ============================================================

-- ============================================================
-- 1. Resource Moderation Status
-- ============================================================

-- Add status column (existing resources default to 'approved')
ALTER TABLE resources ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved'
    CHECK (status IN ('pending','approved','rejected'));

-- Optional rejection reason from moderator
ALTER TABLE resources ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Index for fast filtering by status
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);

-- ============================================================
-- 2. Therapist Profile Links
-- ============================================================

ALTER TABLE therapists ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS credentials_url TEXT;

-- ============================================================
-- 3. Update RLS — Resources visible only if approved (or own)
-- ============================================================

-- Drop existing public select policy
DROP POLICY IF EXISTS "Resources are viewable by everyone" ON resources;

-- New policy: show approved resources to everyone, pending/rejected only to owner
CREATE POLICY "Resources are viewable if approved or own"
    ON resources FOR SELECT USING (
        status = 'approved'
        OR created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role IN ('admin','moderator')))
    );
