-- AI Moderation columns for resources and reviews
ALTER TABLE resources ADD COLUMN IF NOT EXISTS ai_moderation_result JSONB;
ALTER TABLE resource_reviews ADD COLUMN IF NOT EXISTS ai_moderation_result JSONB;

-- Feature flags for AI moderation (enabled by default)
INSERT INTO system_settings (key, value, description)
VALUES
  ('moderation_resources_enabled', 'true'::jsonb, 'Auto-moderate user-submitted resources with AI'),
  ('moderation_reviews_enabled',   'true'::jsonb, 'Auto-moderate user-submitted reviews with AI')
ON CONFLICT (key) DO NOTHING;
