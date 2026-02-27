-- ============================================================
-- Add strikes and therapist moderation
-- ============================================================

-- Add strikes to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS strikes INTEGER DEFAULT 0;

-- Add moderation status to therapists
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending','approved','rejected'));

ALTER TABLE therapists ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Index for fast filtering by status
CREATE INDEX IF NOT EXISTS idx_therapists_status ON therapists(status);

-- Update RLS for therapists
-- Drop existing public select policy
DROP POLICY IF EXISTS "Active therapists are viewable by everyone" ON therapists;

-- New policy: show approved therapists to everyone, pending/rejected only to owner / admins
CREATE POLICY "Therapists are viewable if approved or own"
    ON therapists FOR SELECT USING (
        (status = 'approved' AND is_active = true)
        OR user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role IN ('admin','moderator')))
    );
