-- ============================================================
-- sanemos.ai — Phase 11: Advanced Chat (Sharing, Tags, Searching)
-- ============================================================

-- 1. Extend `conversations` table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private'
    CHECK (visibility IN ('private', 'public', 'shared'));

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS loss_type TEXT
    CHECK (loss_type IS NULL OR loss_type IN ('parent', 'child', 'partner', 'sibling', 'friend', 'pet', 'other', 'general'));

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS worldview TEXT
    CHECK (worldview IS NULL OR worldview IN ('secular', 'spiritual', 'christian', 'jewish', 'muslim', 'buddhist', 'hindu', 'universal'));

-- 2. Create `conversation_shares` table
CREATE TABLE IF NOT EXISTS conversation_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    shared_by_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(conversation_id, shared_with_user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_shares_conversation ON conversation_shares(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_shares_user ON conversation_shares(shared_with_user_id);

-- 3. Update RLS on `conversations` for viewing
-- Drop the old viewing policy
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;

-- Create the new viewing policy
-- A user can view a conversation if:
-- 1. They are a participant
-- 2. The conversation is public
-- 3. The conversation is explicitly shared with them
CREATE POLICY "Users can view permitted conversations"
    ON conversations FOR SELECT USING (
        -- User is a participant
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_participants.conversation_id = conversations.id
            AND conversation_participants.user_id = auth.uid()
        )
        OR
        -- Conversation is public
        visibility = 'public'
        OR
        -- Conversation is shared with the user specifically
        (
            visibility = 'shared' AND EXISTS (
                SELECT 1 FROM conversation_shares
                WHERE conversation_shares.conversation_id = conversations.id
                AND conversation_shares.shared_with_user_id = auth.uid()
            )
        )
    );

-- Note: Inserting messages remains protected by existing "Users can view their conversations" style policies
-- or application logic, as only participants should INSERT messages. We need to ensure message viewing aligns.

-- 4. Update RLS on `messages` for viewing
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;

CREATE POLICY "Users can view messages in permitted conversations"
    ON messages FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND (
                -- User is a participant
                EXISTS (
                    SELECT 1 FROM conversation_participants cp
                    WHERE cp.conversation_id = conversations.id
                    AND cp.user_id = auth.uid()
                )
                OR
                -- Conversation is public
                conversations.visibility = 'public'
                OR
                -- Conversation is shared with the user
                (
                    conversations.visibility = 'shared' AND EXISTS (
                        SELECT 1 FROM conversation_shares cs
                        WHERE cs.conversation_id = conversations.id
                        AND cs.shared_with_user_id = auth.uid()
                    )
                )
            )
        )
    );

-- Ensure users can only UPDATE conversations they participate in
-- (e.g. to change visibility, tags, etc.)
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
CREATE POLICY "Users can update their conversations"
    ON conversations FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_participants.conversation_id = conversations.id
            AND conversation_participants.user_id = auth.uid()
        )
    );

-- 5. RLS for `conversation_shares`
ALTER TABLE conversation_shares ENABLE ROW LEVEL SECURITY;

-- Users can see shares for conversations they can view
CREATE POLICY "Users can view permitted shares"
    ON conversation_shares FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = conversation_shares.conversation_id
            AND (
                EXISTS (
                    SELECT 1 FROM conversation_participants cp
                    WHERE cp.conversation_id = conversations.id
                    AND cp.user_id = auth.uid()
                )
                OR conversations.visibility = 'public'
                OR conversation_shares.shared_with_user_id = auth.uid()
            )
        )
    );

-- Only participants can create shares for a conversation
CREATE POLICY "Participants can create shares"
    ON conversation_shares FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_participants.conversation_id = conversation_shares.conversation_id
            AND conversation_participants.user_id = auth.uid()
        )
    );

-- Only participants can delete shares
CREATE POLICY "Participants can delete shares"
    ON conversation_shares FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_participants.conversation_id = conversation_shares.conversation_id
            AND conversation_participants.user_id = auth.uid()
        )
    );
