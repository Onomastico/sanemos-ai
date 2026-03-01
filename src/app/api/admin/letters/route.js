import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function isStaff(supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_admin')
        .eq('id', user.id)
        .single();
    return profile && (['admin', 'moderator'].includes(profile.role) || profile.is_admin === true);
}

export async function GET(request) {
    const supabase = await createClient();
    if (!(await isStaff(supabase))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    // Use admin client to bypass RLS and see all letters regardless of owner
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
        .from('letters')
        .select(`
            id, content, loss_type, worldview, moderation_status,
            ai_moderation_result, moderation_rejection_reason, created_at,
            profiles(display_name, id)
        `)
        .eq('moderation_status', status)
        .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const letters = (data || []).map(l => ({
        id: l.id,
        excerpt: l.content.replace(/<[^>]*>/g, '').slice(0, 300),
        loss_type: l.loss_type,
        worldview: l.worldview,
        moderation_status: l.moderation_status,
        ai_moderation_result: l.ai_moderation_result,
        moderation_rejection_reason: l.moderation_rejection_reason,
        created_at: l.created_at,
        author_name: l.profiles?.display_name || null,
        author_id: l.profiles?.id || null,
    }));

    return NextResponse.json({ letters });
}
