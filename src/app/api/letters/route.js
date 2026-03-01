import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { sanitizeHtml } from '@/lib/journal/sanitize';
import { moderateLetter } from '@/lib/moderation';

function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
}

export async function GET(request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const mine = searchParams.get('mine') === 'true';
    const loss_type = searchParams.get('loss_type') || '';
    const worldview = searchParams.get('worldview') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 20;
    const offset = (page - 1) * limit;

    // ?mine=true — return the current user's own letters (all statuses)
    if (mine) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ letters: [] });

        const { data, error } = await supabase
            .from('letters')
            .select('id, content, loss_type, worldview, moderation_status, moderation_rejection_reason, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        const letters = (data || []).map(l => ({
            id: l.id,
            excerpt: l.content.replace(/<[^>]*>/g, '').slice(0, 200),
            loss_type: l.loss_type,
            worldview: l.worldview,
            moderation_status: l.moderation_status,
            moderation_rejection_reason: l.moderation_rejection_reason,
            created_at: l.created_at,
        }));

        return NextResponse.json({ letters });
    }

    let query = supabase
        .from('letters')
        .select(`
            id, content, loss_type, worldview, created_at,
            profiles(display_name)
        `)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (loss_type) query = query.eq('loss_type', loss_type);
    if (worldview) query = query.eq('worldview', worldview);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Get comment counts
    const ids = (data || []).map(l => l.id);
    let commentCounts = {};
    if (ids.length > 0) {
        const { data: counts } = await supabase
            .from('letter_comments')
            .select('letter_id')
            .in('letter_id', ids);
        for (const c of (counts || [])) {
            commentCounts[c.letter_id] = (commentCounts[c.letter_id] || 0) + 1;
        }
    }

    const letters = (data || []).map(l => ({
        id: l.id,
        excerpt: l.content.replace(/<[^>]*>/g, '').slice(0, 200),
        loss_type: l.loss_type,
        worldview: l.worldview,
        created_at: l.created_at,
        author_name: l.profiles?.display_name || null,
        comment_count: commentCounts[l.id] || 0,
    }));

    return NextResponse.json({ letters });
}

export async function POST(request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { content, loss_type, worldview } = body;

    if (!content || !content.replace(/<[^>]*>/g, '').trim()) {
        return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const sanitized = sanitizeHtml(content);

    // Insert as pending initially
    const { data: letter, error: insertError } = await supabase
        .from('letters')
        .insert({
            user_id: user.id,
            content: sanitized,
            loss_type: loss_type || null,
            worldview: worldview || null,
            moderation_status: 'pending',
        })
        .select()
        .single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    // Run AI moderation
    try {
        const adminClient = getAdminClient();
        const result = await moderateLetter({ content: sanitized, loss_type, worldview }, adminClient);

        const finalStatus = result.autoApprove ? 'approved' : 'pending';
        const { data: updated } = await supabase
            .from('letters')
            .update({
                moderation_status: finalStatus,
                ai_moderation_result: {
                    decision: result.decision,
                    confidence: result.confidence,
                    reason: result.reason,
                },
            })
            .eq('id', letter.id)
            .select()
            .single();

        return NextResponse.json({ letter: updated || letter });
    } catch {
        return NextResponse.json({ letter });
    }
}
