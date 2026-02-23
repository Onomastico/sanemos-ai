-- ============================================================
-- sanemos.ai — Admin role
-- ============================================================

-- Add admin flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Policy: allow admins to manage all resources
CREATE POLICY "Admins can manage all resources"
    ON resources FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Policy: allow admins to manage all therapists
CREATE POLICY "Admins can manage all therapists"
    ON therapists FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Policy: allow admins to delete any review
CREATE POLICY "Admins can manage therapist reviews"
    ON therapist_reviews FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- To make yourself admin, run:
UPDATE profiles SET is_admin = true WHERE id = 'bbf4017a-97e9-490e-95c6-70b50778fc41';
