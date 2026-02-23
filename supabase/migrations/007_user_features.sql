-- ============================================================
-- sanemos.ai — Phase 7: User Social Features
-- Resource reactions, profile enhancements, loss history
-- ============================================================

-- ============================================================
-- 1. Resource Reactions (Like / Dislike)
-- ============================================================

CREATE TABLE resource_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like','dislike')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(resource_id, user_id)
);

CREATE INDEX idx_resource_reactions_resource ON resource_reactions(resource_id);
CREATE INDEX idx_resource_reactions_user ON resource_reactions(user_id);

-- Add counters to resources
ALTER TABLE resources ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS dislike_count INT DEFAULT 0;

-- Trigger: Update like/dislike counts on reaction change
CREATE OR REPLACE FUNCTION public.update_resource_reactions()
RETURNS trigger AS $$
BEGIN
    UPDATE resources SET
        like_count = (SELECT COUNT(*) FROM resource_reactions WHERE resource_id = COALESCE(NEW.resource_id, OLD.resource_id) AND reaction_type = 'like'),
        dislike_count = (SELECT COUNT(*) FROM resource_reactions WHERE resource_id = COALESCE(NEW.resource_id, OLD.resource_id) AND reaction_type = 'dislike')
    WHERE id = COALESCE(NEW.resource_id, OLD.resource_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_resource_reaction_change
    AFTER INSERT OR UPDATE OR DELETE ON resource_reactions
    FOR EACH ROW EXECUTE FUNCTION public.update_resource_reactions();

-- ============================================================
-- 2. Profile Enhancements
-- ============================================================

-- Nickname (max 30 chars)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname VARCHAR(30);

-- Public profile toggle
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT false;

-- Current loss type
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_loss_type TEXT
    CHECK (current_loss_type IS NULL OR current_loss_type IN ('parent','child','partner','sibling','friend','pet','other'));

-- ============================================================
-- 3. Loss History Enhancements
-- ============================================================

ALTER TABLE user_losses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    CHECK (status IN ('active','resolved'));

ALTER TABLE user_losses ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- ============================================================
-- 4. Comment Length Constraints (255 chars)
-- ============================================================

ALTER TABLE resource_reviews ADD CONSTRAINT resource_review_comment_length
    CHECK (comment IS NULL OR char_length(comment) <= 255);

ALTER TABLE therapist_reviews ADD CONSTRAINT therapist_review_comment_length
    CHECK (comment IS NULL OR char_length(comment) <= 255);

-- ============================================================
-- 5. RLS for Resource Reactions
-- ============================================================

ALTER TABLE resource_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resource reactions are viewable by everyone"
    ON resource_reactions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reactions"
    ON resource_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reactions"
    ON resource_reactions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions"
    ON resource_reactions FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 6. Update profiles RLS for public profiles
-- ============================================================

-- Allow viewing public profiles by anyone (existing policy already allows SELECT for all profiles)
-- But user_losses should be viewable for public profiles too
CREATE POLICY "Users can view losses of public profiles"
    ON user_losses FOR SELECT USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM profiles WHERE id = user_losses.user_id AND is_profile_public = true
        )
    );

-- Drop the old restrictive policy and replace
DROP POLICY IF EXISTS "Users can view own losses" ON user_losses;

-- ============================================================
-- 7. Supabase Storage: Avatars Bucket
-- (Run this separately in SQL Editor if storage policies don't apply via migration)
-- ============================================================

-- Note: The bucket itself must be created via Supabase Dashboard or CLI:
--   1. Go to Supabase Dashboard → Storage → New Bucket
--   2. Name: "avatars"
--   3. Public bucket: YES (so avatar URLs are publicly accessible)
--   4. File size limit: 2MB
--   5. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
--
-- Then create these storage policies via Dashboard → Storage → Policies:
--
-- SELECT (read): Allow public access
--   - Policy name: "Public avatar access"
--   - Target roles: anon, authenticated
--   - USING: true
--
-- INSERT (upload): Authenticated users can upload to their own folder
--   - Policy name: "Users can upload own avatar"
--   - Target roles: authenticated
--   - WITH CHECK: (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
--
-- UPDATE: Users can update own avatar
--   - Policy name: "Users can update own avatar"
--   - Target roles: authenticated
--   - USING: (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
--
-- DELETE: Users can delete own avatar
--   - Policy name: "Users can delete own avatar"
--   - Target roles: authenticated
--   - USING: (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
