-- ============================================================
-- sanemos.ai — Phase 9: New Types & Comment Moderation
-- ============================================================

-- ============================================================
-- 1. Update resource types (add 'song', 'other')
-- ============================================================

ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_type_check;
ALTER TABLE resources ADD CONSTRAINT resources_type_check
    CHECK (type IN ('series','movie','book','comic','manga','song','other'));

-- ============================================================
-- 2. Update loss types (add 'general')
-- ============================================================

-- user_losses
ALTER TABLE user_losses DROP CONSTRAINT IF EXISTS user_losses_loss_type_check;
ALTER TABLE user_losses ADD CONSTRAINT user_losses_loss_type_check
    CHECK (loss_type IN ('parent','child','partner','sibling','friend','pet','other','general'));

-- resource_loss_types
ALTER TABLE resource_loss_types DROP CONSTRAINT IF EXISTS resource_loss_types_loss_type_check;
ALTER TABLE resource_loss_types ADD CONSTRAINT resource_loss_types_loss_type_check
    CHECK (loss_type IN ('parent','child','partner','sibling','friend','pet','other','general'));

-- profiles.current_loss_type
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_current_loss_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_current_loss_type_check
    CHECK (current_loss_type IS NULL OR current_loss_type IN ('parent','child','partner','sibling','friend','pet','other','general'));

-- ============================================================
-- 3. Resource review moderation
-- ============================================================

ALTER TABLE resource_reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved'
    CHECK (status IN ('pending','approved','rejected'));

ALTER TABLE resource_reviews ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_resource_reviews_status ON resource_reviews(status);
