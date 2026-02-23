import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(request, { params }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const { status } = await request.json();

        if (!id || !['accepted', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const admin = createAdminClient();

        // 1. Get the request to verify receiver
        const { data: chatReq, error: fetchError } = await admin
            .from('chat_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !chatReq) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        if (chatReq.receiver_id !== user.id) {
            return NextResponse.json({ error: 'Only the receiver can accept/reject' }, { status: 403 });
        }

        if (chatReq.status !== 'pending') {
            return NextResponse.json({ error: 'Request is already ' + chatReq.status }, { status: 400 });
        }

        // 2. Update status
        const { error: updateError } = await admin
            .from('chat_requests')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // 3. If accepted, create a 1-on-1 private conversation
        if (status === 'accepted') {
            const { data: conversation, error: convError } = await admin
                .from('conversations')
                .insert({
                    type: 'human',
                    visibility: 'private',
                    title: 'Private Chat'
                })
                .select()
                .single();

            if (convError) {
                return NextResponse.json({ error: convError.message }, { status: 500 });
            }

            // Insert both participants
            const { error: partError } = await admin
                .from('conversation_participants')
                .insert([
                    { conversation_id: conversation.id, user_id: chatReq.sender_id },
                    { conversation_id: conversation.id, user_id: chatReq.receiver_id }
                ]);

            if (partError) {
                console.error('Error adding participants:', partError);
            }

            return NextResponse.json({ success: true, conversation });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Error in request PATCH:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
