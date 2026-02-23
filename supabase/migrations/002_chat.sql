-- ============================================================
-- sanemos.ai — Phase 2: Chat & Conversations
-- ============================================================

-- Conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    type TEXT NOT NULL DEFAULT 'ai' CHECK (type IN ('human','ai','group')),
    ai_agent_type TEXT,
    is_active BOOLEAN DEFAULT true,
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Who participates in each conversation
CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(conversation_id, user_id)
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    sender_type TEXT NOT NULL DEFAULT 'user' CHECK (sender_type IN ('user','ai','system')),
    ai_agent_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast message retrieval
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations: viewable by participants
CREATE POLICY "Users can view their conversations"
    ON conversations FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_participants.conversation_id = conversations.id
            AND conversation_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create conversations"
    ON conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Participants can update their conversations"
    ON conversations FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_participants.conversation_id = conversations.id
            AND conversation_participants.user_id = auth.uid()
        )
    );

-- Conversation Participants
CREATE POLICY "Users can view participants of their conversations"
    ON conversation_participants FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = conversation_participants.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can join conversations"
    ON conversation_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messages: viewable by conversation participants
CREATE POLICY "Users can view messages in their conversations"
    ON messages FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_participants.conversation_id = messages.conversation_id
            AND conversation_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Participants can send messages"
    ON messages FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
            sender_id = auth.uid() OR sender_type = 'ai' OR sender_type = 'system'
        )
    );

-- ============================================================
-- Enable Realtime for messages
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================================
-- Trigger: update conversation.updated_at on new message
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger AS $$
BEGIN
    UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_new_message
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();
