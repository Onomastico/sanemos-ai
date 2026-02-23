import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/chat/search — search public and shared conversations
export async function GET(request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const lossType = searchParams.get('loss_type') || '';
    const worldview = searchParams.get('worldview') || '';

    // Step 1: Base query for conversations
    // Only select conversations the user can legally view based on RLS.
    // However, to be explicit in the search, we want to return conversations
    // where title or summary matches `q`, AND optionally filter by loss_type / worldview.

    let query = supabase
        .from('conversations')
        .select(`
            id, title, type, ai_agent_type, summary, created_at, updated_at,
            visibility, loss_type, worldview,
            conversation_participants!inner(user_id)
        `)
        // Ensure we only fetch public, shared matching, or participating ones.
        // The RLS policy handles this at the DB level, so we just query.
        .order('updated_at', { ascending: false });

    // Optional text search
    if (q) {
        query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%`);
    }

    if (lossType) {
        query = query.eq('loss_type', lossType);
    }

    if (worldview) {
        query = query.eq('worldview', worldview);
    }

    const { data: conversations, error } = await query;

    if (error) {
        console.error('Error searching conversations:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // We also want to fetch the participants' display names for these conversations
    // to show who the chat is between.
    const augmentedConversations = await Promise.all(
        (conversations || []).map(async (conv) => {
            // Get participants details
            const { data: participantsData } = await supabase
                .from('conversation_participants')
                .select('user_id, profiles!inner(display_name)')
                .eq('conversation_id', conv.id);

            return {
                ...conv,
                participants: participantsData?.map(p => ({
                    user_id: p.user_id,
                    display_name: p.profiles?.display_name || 'Anonymous'
                })) || []
            };
        })
    );

    return NextResponse.json({ conversations: augmentedConversations });
}
