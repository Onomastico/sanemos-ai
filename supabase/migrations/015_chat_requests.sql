-- ============================================================
-- sanemos.ai — Phase 15: Chat Requests
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast retrieval for a user
CREATE INDEX IF NOT EXISTS idx_chat_requests_receiver ON chat_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_requests_sender ON chat_requests(sender_id, status);

-- Unique partial index: Only one pending request from A to B at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_request ON chat_requests(sender_id, receiver_id) WHERE status = 'pending';

-- Trigger to update timestamp on row update
CREATE OR REPLACE FUNCTION public.update_chat_requests_timestamp()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_chat_request_update
    BEFORE UPDATE ON chat_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_chat_requests_timestamp();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE chat_requests ENABLE ROW LEVEL SECURITY;

-- Users can see requests they sent or received
CREATE POLICY "Users can view relevant chat requests"
    ON chat_requests FOR SELECT USING (
        sender_id = auth.uid() OR receiver_id = auth.uid()
    );

-- Any authenticated user can send a request
CREATE POLICY "Authenticated users can send chat requests"
    ON chat_requests FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND sender_id = auth.uid()
        AND receiver_id != auth.uid() -- cannot self-request
    );

-- Receivers or senders can update the request
CREATE POLICY "Users can update relevant chat requests"
    ON chat_requests FOR UPDATE USING (
        sender_id = auth.uid() OR receiver_id = auth.uid()
    );

-- Users can delete their own requests, or receivers can delete them
CREATE POLICY "Users can delete relevant chat requests"
    ON chat_requests FOR DELETE USING (
        sender_id = auth.uid() OR receiver_id = auth.uid()
    );

-- ============================================================
-- Enable Realtime for chat_requests
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE chat_requests;
