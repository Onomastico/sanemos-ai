import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const loss_type = searchParams.get('loss_type') || '';
    const worldview = searchParams.get('worldview') || '';
    const emotion = searchParams.get('emotion') || '';
    const grief_stage = searchParams.get('grief_stage') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 20;
    const offset = (page - 1) * limit;

    // RLS policy exposes only is_public=true AND moderation_status='approved'
    let query = supabase
        .from('journal_entries')
        .select(`
            id, title, content, loss_type, worldview, emotion, grief_stage, created_at,
            profiles(display_name, avatar_url)
        `)
        .eq('is_public', true)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (loss_type) query = query.eq('loss_type', loss_type);
    if (worldview) query = query.eq('worldview', worldview);
    if (emotion) query = query.eq('emotion', emotion);
    if (grief_stage) query = query.eq('grief_stage', grief_stage);
    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const entries = data.map(e => ({
        id: e.id,
        title: e.title,
        excerpt: e.content.replace(/<[^>]*>/g, '').slice(0, 200),
        loss_type: e.loss_type,
        worldview: e.worldview,
        emotion: e.emotion,
        grief_stage: e.grief_stage,
        created_at: e.created_at,
        author_name: e.profiles?.display_name || null,
    }));

    return NextResponse.json({ entries });
}
