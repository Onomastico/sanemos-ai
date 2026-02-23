-- ============================================================
-- sanemos.ai — Fix RLS Infinite Recursion
-- ============================================================

-- PostgreSQL can trigger infinite recursion if a Row Level Security (RLS) policy
-- queries the same table it is protecting, either directly or indirectly.
-- To solve this, we create a function with SECURITY DEFINER. This runs the
-- query bypassing RLS, safely returning the boolean result without looping.

CREATE OR REPLACE FUNCTION public.is_participant(conv_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = conv_id AND user_id = check_user_id
    );
END;
$$;

-- 1. Fix `conversation_participants` recursive policy
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;

CREATE POLICY "Users can view participants of their conversations"
    ON conversation_participants FOR SELECT USING (
        user_id = auth.uid() OR public.is_participant(conversation_id, auth.uid())
    );

-- 2. Enhance `conversations` update policy to also use this function to be safe
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

CREATE POLICY "Users can update their conversations"
    ON conversations FOR UPDATE USING (
        public.is_participant(id, auth.uid())
    );

-- 3. Enhance `conversations` view policy to be safe
DROP POLICY IF EXISTS "Users can view permitted conversations" ON conversations;

CREATE POLICY "Users can view permitted conversations"
    ON conversations FOR SELECT USING (
        public.is_participant(id, auth.uid())
        OR visibility = 'public'
        OR (
            visibility = 'shared' AND EXISTS (
                SELECT 1 FROM conversation_shares
                WHERE conversation_shares.conversation_id = conversations.id
                AND conversation_shares.shared_with_user_id = auth.uid()
            )
        )
    );
