-- ============================================================
-- Chat message moderation fields
-- ============================================================

-- Flag messages reviewed by the AI moderator
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pass'
    CHECK (moderation_status IN ('pass', 'warn', 'violation'));

-- User suspension (activated automatically after X strikes)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ; -- NULL = indefinite

-- Feature flag for chat moderation
INSERT INTO system_settings (key, value, description)
VALUES
    ('moderation_chat_enabled', 'true'::jsonb, 'Auto-moderate community chat messages with AI')
ON CONFLICT (key) DO NOTHING;

-- Index for fast lookup of flagged messages by admins
CREATE INDEX IF NOT EXISTS idx_messages_is_flagged ON messages(is_flagged) WHERE is_flagged = true;
