import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAIProvider } from '@/lib/ai/provider';
import { getAgent } from '@/lib/ai/agents';
import { moderateMessage } from '@/lib/moderation';

// Strikes threshold before auto-suspension
const STRIKES_BEFORE_SUSPEND = 3;
// Auto-suspension duration in hours
const SUSPENSION_HOURS = 24;

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

    // First get conversation details
    const { data: conversation } = await admin
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

    if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Verify user is a participant
    const { data: participant } = await admin
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .single();

    if (!participant) {
        if (conversation.visibility === 'public') {
            const { error: partErr } = await admin.from('conversation_participants').insert({
                conversation_id: conversationId,
                user_id: user.id
            });
            if (partErr) {
                console.error('Error joining public room:', partErr);
                return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
            }
        } else {
            return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
        }
    }

    // ── Chat moderation (community/public/private — skip for AI conversations) ──
    let moderationStatus = 'pass';
    if (conversation.type !== 'ai') {
        // Check if the user is suspended
        const { data: senderProfile } = await admin
            .from('profiles')
            .select('strikes, is_suspended, suspended_until')
            .eq('id', user.id)
            .single();

        if (senderProfile?.is_suspended) {
            const until = senderProfile.suspended_until;
            if (!until || new Date(until) > new Date()) {
                return NextResponse.json(
                    { error: 'suspended', message: 'Your account is temporarily suspended due to multiple violations.' },
                    { status: 403 }
                );
            }
            // Suspension expired — lift it automatically
            await admin.from('profiles').update({ is_suspended: false }).eq('id', user.id);
        }

        // Moderate the message before saving
        const modResult = await moderateMessage(content, admin);

        if (modResult.decision === 'violation') {
            // Increment strikes and potentially suspend
            const currentStrikes = senderProfile?.strikes || 0;
            const newStrikes = currentStrikes + 1;
            const shouldSuspend = newStrikes >= STRIKES_BEFORE_SUSPEND;
            const suspendedUntil = shouldSuspend
                ? new Date(Date.now() + SUSPENSION_HOURS * 60 * 60 * 1000).toISOString()
                : null;

            await admin.from('profiles').update({
                strikes: newStrikes,
                ...(shouldSuspend ? { is_suspended: true, suspended_until: suspendedUntil } : {}),
            }).eq('id', user.id);

            return NextResponse.json(
                {
                    error: 'moderation_violation',
                    reason: modResult.reason,
                    strikes: newStrikes,
                    suspended: shouldSuspend,
                },
                { status: 422 }
            );
        }

        if (modResult.decision === 'warn') {
            moderationStatus = 'warn';
        }
    }

    // Save user's message
    const { error: msgError } = await admin.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        sender_type: 'user',
        ...(moderationStatus !== 'pass' ? { is_flagged: true, moderation_status: moderationStatus } : {}),
    });

    if (msgError) {
        console.error('Message insert error:', msgError);
        return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    // Use the conversation details fetched above
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
