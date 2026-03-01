import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeHtml } from '@/lib/journal/sanitize';
import { moderateJournal } from '@/lib/moderation';

export async function GET(request, { params }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error || !data) return NextResponse.json({ error: 'Entrada no encontrada.' }, { status: 404 });

    return NextResponse.json({ entry: data });
}

export async function PATCH(request, { params }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // Load current entry to detect is_public transition
    const { data: current, error: fetchErr } = await supabase
        .from('journal_entries')
        .select('id, is_public, moderation_status, title, content')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (fetchErr || !current) return NextResponse.json({ error: 'Entrada no encontrada.' }, { status: 404 });

    const body = await request.json();
    const { title, content, loss_type, worldview, emotion, grief_stage, is_public } = body;

    const updates = {};
    if (title !== undefined) updates.title = title?.trim() || null;
    if (content !== undefined) updates.content = sanitizeHtml(content);
    if (loss_type !== undefined) updates.loss_type = loss_type || null;
    if (worldview !== undefined) updates.worldview = worldview || null;
    if (emotion !== undefined) updates.emotion = emotion || null;
    if (grief_stage !== undefined) updates.grief_stage = grief_stage || null;

    // Handle publication toggle
    if (is_public !== undefined) {
        if (is_public && !current.is_public) {
            // User is requesting to make entry public → trigger moderation
            updates.is_public = true;
            updates.moderation_status = 'pending';
            updates.moderation_rejection_reason = null;

            // Run moderation asynchronously but wait for it before responding
            // so the client immediately gets the real moderation_status
            const admin = createAdminClient();
            const entryForMod = {
                title: updates.title ?? current.title,
                content: updates.content ?? current.content,
            };
            const result = await moderateJournal(entryForMod, admin);

            updates.ai_moderation_result = result;
            updates.moderation_status = result.autoApprove ? 'approved' : 'pending';

        } else if (!is_public) {
            // User is making entry private again
            updates.is_public = false;
            updates.moderation_status = 'private';
            updates.ai_moderation_result = null;
            updates.moderation_rejection_reason = null;
        }
    }

    const { data, error } = await supabase
        .from('journal_entries')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ entry: data });
}

export async function DELETE(request, { params }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
}
