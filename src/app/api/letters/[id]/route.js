import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request, { params }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { id } = await params;

    // Fetch the letter — RLS allows: approved letters (anyone) + own letters (author)
    const { data: letter, error } = await supabase
        .from('letters')
        .select(`
            id, content, loss_type, worldview, moderation_status,
            moderation_rejection_reason, ai_moderation_result,
            created_at, user_id,
            profiles(display_name)
        `)
        .eq('id', id)
        .single();

    if (error || !letter) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // If not approved and not the owner, deny
    if (letter.moderation_status !== 'approved' && letter.user_id !== user?.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Get comments
    const { data: comments } = await supabase
        .from('letter_comments')
        .select(`
            id, content, created_at,
            profiles(display_name, avatar_url)
        `)
        .eq('letter_id', id)
        .order('created_at', { ascending: true });

    return NextResponse.json({
        letter: {
            ...letter,
            author_name: letter.profiles?.display_name || null,
            is_own: letter.user_id === user?.id,
        },
        comments: (comments || []).map(c => ({
            id: c.id,
            content: c.content,
            created_at: c.created_at,
            author_name: c.profiles?.display_name || null,
            avatar_url: c.profiles?.avatar_url || null,
        })),
    });
}

export async function DELETE(request, { params }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { error } = await supabase
        .from('letters')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // RLS also enforces this

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
