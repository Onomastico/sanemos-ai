import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_TYPES = ['chat_message', 'letter', 'journal', 'community_message', 'comment', 'other'];
const VALID_REASONS = ['spam', 'harassment', 'self_harm', 'misinformation', 'inappropriate', 'other'];

export async function POST(request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { content_type, content_id, reason, details } = body;

    if (!VALID_TYPES.includes(content_type)) {
        return NextResponse.json({ error: 'Invalid content_type' }, { status: 400 });
    }
    if (!VALID_REASONS.includes(reason)) {
        return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
    }

    const { error } = await supabase
        .from('content_reports')
        .insert({
            reporter_id: user.id,
            content_type,
            content_id: content_id || null,
            reason,
            details: details?.trim()?.slice(0, 500) || null,
            status: 'pending',
        });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
}
