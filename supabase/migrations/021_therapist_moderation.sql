-- ============================================================
-- AI moderation column for therapists
-- ============================================================

ALTER TABLE therapists ADD COLUMN IF NOT EXISTS ai_moderation_result JSONB;

-- Feature flag (defaults to enabled)
INSERT INTO system_settings (key, value, description)
VALUES
    ('moderation_therapists_enabled', 'true'::jsonb, 'Pre-screen user-submitted therapists with AI before human review')
ON CONFLICT (key) DO NOTHING;
