-- ============================================================
-- sanemos.ai — Phase 16: Add conversation_id to chat_requests
-- ============================================================

ALTER TABLE chat_requests 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

-- The column allows us to pass the newly created conversation ID directly
-- back to the sender via Supabase Realtime when the status is updated to "accepted".
