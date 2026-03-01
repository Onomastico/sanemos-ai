-- ── Moderation appeals ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS moderation_appeals (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
    appeal_type  TEXT NOT NULL CHECK (appeal_type IN ('content_removed','strike','suspension_temp','suspension_perm','other')),
    display_name TEXT NOT NULL,
    email        TEXT NOT NULL,
    description  TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','under_review','upheld','overturned','dismissed')),
    reviewer_notes TEXT,
    created_at   TIMESTAMPTZ DEFAULT now(),
    resolved_at  TIMESTAMPTZ
);

ALTER TABLE moderation_appeals ENABLE ROW LEVEL SECURITY;

-- Anyone (even anon) can insert; staff can read and update
CREATE POLICY "appeals_insert" ON moderation_appeals FOR INSERT WITH CHECK (true);

CREATE POLICY "appeals_staff_read" ON moderation_appeals FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin','moderator')
        )
    );

CREATE POLICY "appeals_staff_update" ON moderation_appeals FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin','moderator')
        )
    );

-- Logged-in users can see their own appeals
CREATE POLICY "appeals_own_read" ON moderation_appeals FOR SELECT TO authenticated
    USING (user_id = auth.uid());
