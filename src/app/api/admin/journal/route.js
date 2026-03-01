import { NextResponse } from 'next/server';
import { checkStaff } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request) {
    const { isStaff } = await checkStaff();
    if (!isStaff) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const admin = createAdminClient();
    const { data, error } = await admin
        .from('journal_entries')
        .select(`
            id, title, content, is_public, moderation_status,
            ai_moderation_result, moderation_rejection_reason,
            loss_type, worldview, emotion, grief_stage,
            created_at,
            profiles(id, display_name, avatar_url)
        `)
        .eq('moderation_status', status)
        .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const entries = data.map(e => ({
        ...e,
        excerpt: e.content.replace(/<[^>]*>/g, '').slice(0, 300),
    }));

    return NextResponse.json({ entries });
}
