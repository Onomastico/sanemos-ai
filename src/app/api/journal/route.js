import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeHtml } from '@/lib/journal/sanitize';

export async function GET(request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'list';
    const month = searchParams.get('month'); // YYYY-MM, for calendar view
    const search = searchParams.get('search') || '';
    const emotion = searchParams.get('emotion') || '';
    const grief_stage = searchParams.get('grief_stage') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 20;
    const offset = (page - 1) * limit;

    if (view === 'calendar' && month) {
        // Return minimal data for calendar dots: date + count + hasPublic
        const startDate = `${month}-01`;
        const [year, mon] = month.split('-').map(Number);
        const endDate = new Date(year, mon, 1).toISOString().split('T')[0]; // first day next month

        const { data, error } = await supabase
            .from('journal_entries')
            .select('id, created_at, moderation_status, is_public')
            .eq('user_id', user.id)
            .gte('created_at', startDate)
            .lt('created_at', endDate)
            .order('created_at', { ascending: true });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Return lightweight entry list so the client can derive per-day data
        // and render title badges directly in the calendar cells
        const entries = data.map(e => ({
            id: e.id,
            title: e.title,
            created_at: e.created_at,
            is_public: e.is_public,
            moderation_status: e.moderation_status,
        }));

        return NextResponse.json({ entries });
    }

    // List view: return entries with excerpt only
    let query = supabase
        .from('journal_entries')
        .select('id, title, content, is_public, moderation_status, moderation_rejection_reason, loss_type, worldview, emotion, grief_stage, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    if (emotion) query = query.eq('emotion', emotion);
    if (grief_stage) query = query.eq('grief_stage', grief_stage);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Truncate content to excerpt
    const entries = data.map(e => ({
        ...e,
        excerpt: e.content.replace(/<[^>]*>/g, '').slice(0, 200),
    }));

    return NextResponse.json({ entries });
}

export async function POST(request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { title, content, loss_type, worldview, emotion, grief_stage } = body;

    if (!content?.trim()) {
        return NextResponse.json({ error: 'El contenido no puede estar vacío.' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('journal_entries')
        .insert({
            user_id: user.id,
            title: title?.trim() || null,
            content: sanitizeHtml(content),
            is_public: false,
            moderation_status: 'private',
            loss_type: loss_type || null,
            worldview: worldview || null,
            emotion: emotion || null,
            grief_stage: grief_stage || null,
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ entry: data }, { status: 201 });
}
