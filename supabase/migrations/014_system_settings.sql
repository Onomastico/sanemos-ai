-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Allow reading for everyone
DROP POLICY IF EXISTS "Anyone can read system settings" ON system_settings;
CREATE POLICY "Anyone can read system settings"
    ON system_settings
    FOR SELECT
    USING (true);

-- Allow admins to insert/update/delete
DROP POLICY IF EXISTS "Admins can manage system settings" ON system_settings;
CREATE POLICY "Admins can manage system settings"
    ON system_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- Insert default AI provider (gemini)
INSERT INTO system_settings (key, value, description)
VALUES (
    'active_ai_provider', 
    '"gemini"'::jsonb, 
    'The currently active AI Provider for companions (openai or gemini)'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;
