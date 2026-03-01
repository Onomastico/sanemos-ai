-- ── ARCO rights requests ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS arco_requests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    right_type  TEXT NOT NULL CHECK (right_type IN ('access','rectification','cancellation','opposition','delete_account')),
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    description TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','resolved')),
    admin_notes TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- Only admins/moderators can read; anyone (even anon) can insert via API
ALTER TABLE arco_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "arco_insert" ON arco_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "arco_staff_read" ON arco_requests FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin','moderator')
        )
    );
CREATE POLICY "arco_staff_update" ON arco_requests FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin','moderator')
        )
    );

-- ── Content reports ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content_type    TEXT NOT NULL CHECK (content_type IN ('chat_message','letter','journal','community_message','comment','other')),
    content_id      UUID,         -- ID of the reported item (nullable for "other")
    reason          TEXT NOT NULL CHECK (reason IN ('spam','harassment','self_harm','misinformation','inappropriate','other')),
    details         TEXT,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed','actioned')),
    admin_notes     TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    reviewed_at     TIMESTAMPTZ
);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_insert" ON content_reports FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_own_read" ON content_reports FOR SELECT TO authenticated
    USING (reporter_id = auth.uid());
CREATE POLICY "reports_staff_all" ON content_reports FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin','moderator')
        )
    );

-- Feature flag
INSERT INTO system_settings (key, value)
    VALUES ('reports_enabled', 'true')
    ON CONFLICT (key) DO NOTHING;
