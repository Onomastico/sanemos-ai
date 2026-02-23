import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAIProvider } from '@/lib/ai/provider';
import { getAgent } from '@/lib/ai/agents';

export async function POST(request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, content } = body;

    if (!conversationId || !content) {
        return NextResponse.json({ error: 'Missing conversationId or content' }, { status: 400 });
    }

    // Use admin client for all DB operations to avoid RLS issues
    const admin = createAdminClient();

    // Verify user is a participant
    const { data: participant } = await admin
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .single();

    if (!participant) {
        return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Save user's message
    const { error: msgError } = await admin.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        sender_type: 'user',
    });

    if (msgError) {
        console.error('Message insert error:', msgError);
        return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    // Get conversation details
    const { data: conversation } = await admin
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

    // If it's an AI conversation, generate a response
    if (conversation?.type === 'ai' && conversation?.ai_agent_type) {
        const agent = getAgent(conversation.ai_agent_type);

        if (agent) {
            // Get conversation history (last 20 messages for context)
            const { data: history } = await admin
                .from('messages')
                .select('content, sender_type')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })
                .limit(20);

            const messages = (history || []).map((msg) => ({
                role: msg.sender_type === 'user' ? 'user' : 'assistant',
                content: msg.content,
            }));

            try {
                // Fetch active provider from system_settings
                const { data: settings } = await admin
                    .from('system_settings')
                    .select('value')
                    .eq('key', 'active_ai_provider')
                    .single();

                // value is stored as a JSON string, replace quotes if any
                let activeProvider = 'openai';
                if (settings && settings.value) {
                    activeProvider = typeof settings.value === 'string'
                        ? settings.value.replace(/"/g, '')
                        : settings.value;
                }

                const aiProvider = createAIProvider(activeProvider);
                const aiResponse = await aiProvider.generateResponse(messages, agent);

                // Save AI response using admin client (bypasses RLS)
                const { error: aiMsgError } = await admin.from('messages').insert({
                    conversation_id: conversationId,
                    content: aiResponse,
                    sender_type: 'ai',
                    ai_agent_type: conversation.ai_agent_type,
                });

                if (aiMsgError) {
                    console.error('AI message insert error:', aiMsgError);
                }

                return NextResponse.json({
                    success: true,
                    aiResponse: {
                        content: aiResponse,
                        agent: conversation.ai_agent_type,
                    }
                });
            } catch (err) {
                console.error('AI generation error:', err);

                // Save fallback message
                const fallback = `I'm having trouble connecting right now, but I'm still here for you. Please try again in a moment. 💙`;
                await admin.from('messages').insert({
                    conversation_id: conversationId,
                    content: fallback,
                    sender_type: 'ai',
                    ai_agent_type: conversation.ai_agent_type,
                });

                return NextResponse.json({
                    success: true,
                    aiResponse: {
                        content: fallback,
                        agent: conversation.ai_agent_type,
                    }
                });
            }
        }
    }

    return NextResponse.json({ success: true });
}
