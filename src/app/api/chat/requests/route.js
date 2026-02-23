import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { receiverId, message } = await request.json();

        if (!receiverId || receiverId === user.id) {
            return NextResponse.json({ error: 'Valid receiverId required' }, { status: 400 });
        }

        const admin = createAdminClient();

        // Optional: Check if a pending request already exists between these users
        const { data: existing, error: searchError } = await admin
            .from('chat_requests')
            .select('id, status')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
            .eq('status', 'pending');

        if (existing && existing.length > 0) {
            return NextResponse.json({ error: 'A pending request already exists.' }, { status: 400 });
        }

        const { data, error } = await admin
            .from('chat_requests')
            .insert({
                sender_id: user.id,
                receiver_id: receiverId,
                status: 'pending',
                message: message || null
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating chat request:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ request: data });
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
