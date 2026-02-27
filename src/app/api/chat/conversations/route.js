import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to avoid RLS issues with joins
    const admin = createAdminClient();

    const { data, error } = await admin
        .from('conversations')
        .select(`
            *,
            conversation_participants!inner (user_id),
            messages (content, sender_type, ai_agent_type, created_at)
        `)
        .eq('conversation_participants.user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Conversations fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get last message for each conversation for preview
    const conversations = (data || []).map((conv) => {
        const lastMsg = conv.messages?.sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        )[0];
        return {
            ...conv,
            lastMessage: lastMsg || null,
            messages: undefined,
        };
    });

    return NextResponse.json({ conversations });
}

export async function POST(request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agentType, title, visibility, lossType, worldview } = body;

    // Use admin client to create conversation and add participant
    const admin = createAdminClient();

    // Ensure profile exists for this user (handles local dev missing trigger cases)
    const { data: profileCheck } = await admin.from('profiles').select('id').eq('id', user.id).single();
    if (!profileCheck) {
        await admin.from('profiles').insert({
            id: user.id,
            display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: 'user'
        });
    }

    // Create conversation
    const { data: conversation, error: convError } = await admin
        .from('conversations')
        .insert({
            type: agentType ? 'ai' : 'human',
            ai_agent_type: agentType || null,
            title: title || (agentType ? `Chat with ${agentType}` : 'New conversation'),
            visibility: visibility || 'private',
            loss_type: lossType || null,
            worldview: worldview || null
        })
        .select()
        .single();

    if (convError) {
        console.error('Conversation create error:', convError);
        return NextResponse.json({ error: convError.message }, { status: 500 });
    }

    // Add user as participant
    const { error: partError } = await admin.from('conversation_participants').insert({
        conversation_id: conversation.id,
        user_id: user.id,
    });

    if (partError) {
        console.error('Participant insert error:', partError);
    }

    return NextResponse.json({ conversation });
}
