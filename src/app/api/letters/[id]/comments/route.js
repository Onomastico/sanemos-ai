import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request, { params }) {
    const supabase = await createClient();
    const { id } = await params;

    const { data: comments, error } = await supabase
        .from('letter_comments')
        .select(`
            id, content, created_at,
            profiles(display_name, avatar_url)
        `)
        .eq('letter_id', id)
        .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
        comments: (comments || []).map(c => ({
            id: c.id,
            content: c.content,
            created_at: c.created_at,
            author_name: c.profiles?.display_name || null,
            avatar_url: c.profiles?.avatar_url || null,
        })),
    });
}

export async function POST(request, { params }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { content } = await request.json();

    if (!content || !content.trim()) {
        return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
    }
    if (content.length > 500) {
        return NextResponse.json({ error: 'Comment exceeds 500 characters' }, { status: 400 });
    }

    // Verify letter is approved (or own)
    const { data: letter } = await supabase
        .from('letters')
        .select('moderation_status, user_id')
        .eq('id', id)
        .single();

    if (!letter || (letter.moderation_status !== 'approved' && letter.user_id !== user.id)) {
        return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
    }

    const { data: comment, error } = await supabase
        .from('letter_comments')
        .insert({
            letter_id: id,
            user_id: user.id,
            content: content.trim(),
        })
        .select(`
            id, content, created_at,
            profiles(display_name, avatar_url)
        `)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
        comment: {
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            author_name: comment.profiles?.display_name || null,
            avatar_url: comment.profiles?.avatar_url || null,
        },
    });
}
