-- ============================================================
-- sanemos.ai — Conversation search
-- ============================================================

-- Full-text search index on messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_messages_search ON messages USING gin(search_vector);

-- Index for faster conversation queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
