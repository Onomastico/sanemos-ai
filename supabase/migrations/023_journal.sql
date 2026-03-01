-- Migration 023: Personal Journal (Diario Personal)
-- Each user has a private journal. Entries can be made public, which triggers
-- AI moderation before they appear in the "Community Journals" section.

-- ── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE journal_entries (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title            TEXT,
    content          TEXT NOT NULL,          -- sanitized HTML (b, i, ul, ol, li, p, br only)
    is_public        BOOLEAN NOT NULL DEFAULT false,

    -- Moderation workflow
    -- 'private'  = user has not requested publication
    -- 'pending'  = user requested publication, awaiting AI/human review
    -- 'approved' = visible in community journals
    -- 'rejected' = human reviewer rejected; is_public is reset to false
    moderation_status TEXT NOT NULL DEFAULT 'private'
        CHECK (moderation_status IN ('private', 'pending', 'approved', 'rejected')),
    ai_moderation_result      JSONB,         -- { decision, confidence, reason }
    moderation_rejection_reason TEXT,        -- human reviewer note when rejecting

    -- Taxonomy (all optional — same enums as resources)
    loss_type   TEXT CHECK (loss_type   IN ('parent','child','partner','sibling','friend','pet','other','general')),
    worldview   TEXT CHECK (worldview   IN ('secular','spiritual','christian','jewish','muslim','buddhist','hindu','universal')),
    emotion     TEXT CHECK (emotion     IN ('sadness','anger','nostalgia','gratitude','confusion','hope','peace','other')),
    grief_stage TEXT CHECK (grief_stage IN ('denial','anger','bargaining','depression','acceptance')),

    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Trigger ───────────────────────────────────────────────────────────────────

CREATE TRIGGER journal_entries_updated_at
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Feature flag ──────────────────────────────────────────────────────────────

INSERT INTO system_settings (key, value)
VALUES ('moderation_journal_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Fast lookup for admin moderation queue
CREATE INDEX idx_journal_moderation_pending ON journal_entries(moderation_status)
    WHERE moderation_status = 'pending';

-- Fast listing of a user's own entries (ordered by date)
CREATE INDEX idx_journal_user_created ON journal_entries(user_id, created_at DESC);

-- Fast community feed (approved public entries)
CREATE INDEX idx_journal_community ON journal_entries(created_at DESC)
    WHERE is_public = true AND moderation_status = 'approved';

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Owner: full access to their own entries (read, insert, update, delete)
CREATE POLICY "journal_owner_all"
    ON journal_entries
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Public: anyone (including anon) can read approved public entries
CREATE POLICY "journal_public_read"
    ON journal_entries
    FOR SELECT
    TO authenticated, anon
    USING (is_public = true AND moderation_status = 'approved');
