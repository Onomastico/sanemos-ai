-- ============================================================
-- sanemos.ai — Fix Conversations RLS Recursion
-- ============================================================

-- The previous migration `011_advanced_chat.sql` introduced a cyclic dependency:
-- `conversations` SELECT policy queries `conversation_shares`
-- `conversation_shares` SELECT policy queries `conversations`
-- This creates an infinite recursion Error: relation "conversations".
-- We fix this by removing the `conversations` query from `conversation_shares`
-- and instead using the `public.is_participant` function we created in 012.

-- 1. Fix `conversation_shares` SELECT policy
DROP POLICY IF EXISTS "Users can view permitted shares" ON conversation_shares;

CREATE POLICY "Users can view permitted shares"
    ON conversation_shares FOR SELECT USING (
        shared_with_user_id = auth.uid()
        OR shared_by_user_id = auth.uid()
        OR public.is_participant(conversation_id, auth.uid())
    );

-- 2. Clean up `messages` view policy to avoid redundantly checking participants manually
-- and instead just rely on the fact that if they can SELECT the conversation, 
-- they should be able to SELECT the message (though RLS doesn't allow joining the protected 
-- table easily without risking recursion, so we'll use a direct safe check).
DROP POLICY IF EXISTS "Users can view messages in permitted conversations" ON messages;

CREATE POLICY "Users can view messages in permitted conversations"
    ON messages FOR SELECT USING (
        -- User is a participant
        public.is_participant(conversation_id, auth.uid())
        OR
        -- Or the conversation is public
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND conversations.visibility = 'public'
        )
        OR
        -- Or explicitly shared
        EXISTS (
            SELECT 1 FROM conversation_shares
            WHERE conversation_shares.conversation_id = messages.conversation_id
            AND conversation_shares.shared_with_user_id = auth.uid()
        )
    );
