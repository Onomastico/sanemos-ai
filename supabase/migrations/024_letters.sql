-- ============================================================
-- sanemos.ai — Letters (Cartas) feature
-- ============================================================

-- Add loss_type and worldview preferences to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS loss_type TEXT
    CHECK (loss_type IN ('parent','child','partner','sibling','friend','pet','other','general'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS worldview TEXT
    CHECK (worldview IN ('secular','spiritual','christian','jewish','muslim','buddhist','hindu','universal'));

-- Update handle_new_user trigger to pick up loss_type and worldview from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, role, locale, loss_type, worldview)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'display_name', 'User'),
        'user',
        COALESCE(new.raw_user_meta_data->>'locale', 'en'),
        new.raw_user_meta_data->>'loss_type',
        new.raw_user_meta_data->>'worldview'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Letters table
-- ============================================================

CREATE TABLE IF NOT EXISTS letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    loss_type TEXT CHECK (loss_type IN ('parent','child','partner','sibling','friend','pet','other','general')),
    worldview TEXT CHECK (worldview IN ('secular','spiritual','christian','jewish','muslim','buddhist','hindu','universal')),
    moderation_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (moderation_status IN ('pending','approved','rejected')),
    ai_moderation_result JSONB,
    moderation_rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER letters_updated_at
    BEFORE UPDATE ON letters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_letters_moderation ON letters(moderation_status)
    WHERE moderation_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_letters_approved ON letters(created_at DESC)
    WHERE moderation_status = 'approved';
CREATE INDEX IF NOT EXISTS idx_letters_user ON letters(user_id, created_at DESC);

-- ============================================================
-- Letter comments table
-- ============================================================

CREATE TABLE IF NOT EXISTS letter_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) <= 500),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_letter_comments_letter ON letter_comments(letter_id, created_at ASC);

-- ============================================================
-- Feature flag
-- ============================================================

INSERT INTO system_settings (key, value) VALUES ('moderation_letters_enabled', 'true')
    ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE letter_comments ENABLE ROW LEVEL SECURITY;

-- Letters: author can do everything with their own letters
CREATE POLICY "letters_author_all" ON letters
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Letters: anyone can read approved letters
CREATE POLICY "letters_public_read" ON letters
    FOR SELECT TO authenticated, anon
    USING (moderation_status = 'approved');

-- Comments: anyone can read
CREATE POLICY "comments_read" ON letter_comments
    FOR SELECT USING (true);

-- Comments: authenticated users can insert their own
CREATE POLICY "comments_write" ON letter_comments
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Comments: users can delete their own comments
CREATE POLICY "comments_delete_own" ON letter_comments
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);
